# Kisan Sahayak Portal — Domain Model

## Core concepts

### User
A person who can authenticate. Farmers and admins are both users with different roles.

- `id`, `email`, `mobile`, `role` (`farmer` | `admin` | `super_admin` | `support_agent`), `language`, `emailVerifiedAt`, `mobileVerifiedAt`, `createdAt`

### FarmerProfile
The identity and address information for a farmer. Owned by one user.

- `userId`, `fullName`, `addressLine1`, `addressLine2`, `village`, `district`, `state`, `pincode`, `serviceAreaId`, `aadhaarRef`, `aadhaarLast4`, `aadhaarDocumentId`, `verificationStatus`, `consentGivenAt`

### ServiceArea
A configured administrative area used to route farmers to centres.

- `id`, `state`, `district`, `subDistrict`, `code`, `pincodes[]`

### Centre
A procurement location. May serve one or more service areas.

- `id`, `name`, `address`, `pincode`, `latitude`, `longitude`, `district`, `state`, `contactPhone`, `openingHours`, `status`, `commodities[]`, `serviceAreas[]`

### ProcurementWindow
A season/commodity procurement period.

- `id`, `commodity`, `season`, `year`, `startDate`, `endDate`, `status`

### Slot
A specific date, time window and capacity at a centre for one procurement window.

- `id`, `centreId`, `procurementWindowId`, `slotDate`, `startTime`, `endTime`, `capacity`, `bookedCount`, `status` (`draft` | `scheduled` | `open` | `full` | `closed` | `cancelled`), `publishAt`

### Booking
A farmer’s reservation for a slot.

- `id`, `farmerId`, `slotId`, `bookingCode`, `tokenNumber`, `status` (`pending` | `confirmed` | `arrived` | `procured` | `payment_initiated` | `payment_completed` | `payment_failed` | `cancelled`), `createdAt`, `updatedAt`

### Announcement
A targeted message sent by admin to farmers.

- `id`, `title`, `message`, `audienceType` (`all` | `service_area` | `active_bookings`), `serviceAreaId`, `sendChannels` (`in_app` | `email`), `scheduledAt`, `sentAt`, `createdBy`

### Notification
An in-app message created for a user.

- `id`, `userId`, `type`, `title`, `body`, `readAt`, `createdAt`

### OutboundMessage
A record of an attempted email/SMS.

- `id`, `userId`, `channel`, `templateKey`, `payload`, `status`, `providerMessageId`, `sentAt`, `failureReason`

### AuditLog
An append-only record of admin actions and sensitive access.

- `id`, `actorUserId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`

## Key invariants

- A farmer can have only **one active booking per procurement window**.
- A slot cannot be overbooked: `bookedCount <= capacity`, enforced by a `SELECT ... FOR UPDATE` transaction.
- A farmer can only book slots at centres mapped to their service area.
- Aadhaar documents are never stored as public files; only authenticated references are kept.
- Timestamps are stored in UTC; displayed in `Asia/Kolkata`.
- All status changes for bookings and slots are append-only events where financial/audit impact exists.

## Booking state machine

```
PENDING -> CONFIRMED -> ARRIVED -> PROCURED -> PAYMENT_INITIATED -> PAYMENT_COMPLETED
  |
  v
CANCELLED
```

Illegal transitions: `PAYMENT_COMPLETED` cannot revert; `CANCELLED` cannot become active again.

## Slot state machine

```
DRAFT -> SCHEDULED -> OPEN -> FULL
  |         |        |
  v         v        v
CLOSED   CANCELLED  CLOSED
```

`FULL` is reached automatically when `bookedCount == capacity` in the same transaction as the booking.

## Centre eligibility

1. Validate farmer’s pincode.
2. Resolve pincode to `serviceAreaId`.
3. Return active centres whose `centre_area_map` includes that `serviceAreaId`.
4. Optional: rank by distance from farmer’s geolocation as a presentation layer only.

## Concurrency rule

Pseudocode for booking:

```
BEGIN TRANSACTION
  SELECT * FROM slots WHERE id = ? FOR UPDATE
  IF status != 'open' OR booked_count >= capacity THEN
    ROLLBACK; return error
  INSERT booking
  UPDATE slots SET booked_count = booked_count + 1
  IF booked_count + 1 == capacity THEN
    UPDATE slots SET status = 'full'
  INSERT notification, queue email
COMMIT
```

Email/SMS failures do not roll back the booking.