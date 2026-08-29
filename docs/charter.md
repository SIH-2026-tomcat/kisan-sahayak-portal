# Kisan Sahayak Portal — MVP Charter

## Goal

Deliver a working hackathon MVP of the Farmer Procurement Portal with two portals (farmer and admin), secure slot booking, realtime updates and a complete demo workflow.

## Acceptance criteria

Each criterion must be demonstrable by a command, test or observed behaviour.

1. `POST /auth/register` creates an unverified user and triggers Neon Auth email/mobile verification.
2. `POST /farmers/profile` stores the farmer profile with address and pincode.
3. `GET /areas/by-pincode/:pincode` returns the configured service area and eligible centres.
4. `POST /farmers/aadhaar-document` uploads the Aadhaar document to private Cloudinary storage and stores the asset reference.
5. `GET /centres?serviceAreaId=` returns only active centres mapped to the farmer’s service area.
6. `GET /slots?status=open&serviceAreaId=` returns live slot availability.
7. `POST /slots/:id/book` decrements remaining capacity atomically and prevents overbooking under concurrent requests.
8. When a slot reaches capacity, its status becomes `FULL` and the UI shows it as unavailable.
9. A successful booking creates an in-app notification and an email event.
10. `POST /admin/announcements` sends an in-app + email announcement to the selected audience.
11. The language selector changes all UI strings between English, Hindi, Telugu and Bengali.
12. The mobile layout is fully usable at 360px without horizontal scroll.
13. The admin farmer list masks mobile, email and Aadhaar by default.
14. All important actions produce human-readable errors and recovery steps.
15. Map view is always accompanied by a text list of centres.
16. Seed data makes the full demo workflow runnable immediately after `npm install && npm run db:migrate && npm run db:seed`.

## Risks

- Neon Auth mobile OTP support in India must be verified before final demo.
- Resend domain `hawkvance.in` must be verified or emails will fail.
- Cloudinary cloud name + API secret are still needed for Aadhaar upload.
- OSM tiles must show attribution and not be treated as unlimited production tiles.