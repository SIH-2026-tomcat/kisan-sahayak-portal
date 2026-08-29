import crypto from "node:crypto";
import { db, slots, bookings, farmerProfiles, centreAreaMap, centres } from "@kisan/db";
import { and, eq, ne } from "drizzle-orm";
import { publish } from "../lib/events.js";
import { enqueueNotification } from "../lib/notify.js";
import { audit } from "../lib/audit.js";

export class BookingError extends Error {
  constructor(public code: string, message: string, public status = 409) {
    super(message);
  }
}

function generateBookingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KS-";
  for (let i = 0; i < 6; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

export async function bookSlot(userId: string, slotId: string) {
  const [profile] = await db.select().from(farmerProfiles).where(eq(farmerProfiles.userId, userId));
  if (!profile) throw new BookingError("ProfileRequired", "Please complete your farmer profile before booking a slot.", 400);
  if (!profile.serviceAreaId)
    throw new BookingError("ServiceAreaRequired", "Your pincode is not mapped to a service area yet.", 400);

  // Eligibility (centre must serve the farmer's area) - checked before the tx
  const [eligible] = await db
    .select({ slotId: slots.id, centreName: centres.name, centreAddress: centres.address })
    .from(slots)
    .innerJoin(centres, eq(slots.centreId, centres.id))
    .innerJoin(centreAreaMap, eq(centreAreaMap.centreId, slots.centreId))
    .where(and(eq(slots.id, slotId), eq(centreAreaMap.serviceAreaId, profile.serviceAreaId)))
    .limit(1);
  if (!eligible)
    throw new BookingError("SlotNotEligible", "This centre is outside your service area and cannot be booked from this account.", 403);

  const booking = await db.transaction(async (tx) => {
    const [slot] = await tx
      .select({
        id: slots.id,
        bookedCount: slots.bookedCount,
        capacity: slots.capacity,
        status: slots.status,
        slotDate: slots.slotDate,
        startTime: slots.startTime,
        endTime: slots.endTime,
        centreId: slots.centreId,
        procurementWindowId: slots.procurementWindowId,
      })
      .from(slots)
      .where(eq(slots.id, slotId))
      .for("update");

    if (!slot || slot.status !== "open")
      throw new BookingError("BookingWindowClosed", "This slot is no longer open for booking.");
    if (slot.bookedCount >= slot.capacity)
      throw new BookingError("SlotFull", "This slot was just taken by another farmer. Please select another available slot.");

    const dupSlot = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.farmerId, userId), eq(bookings.slotId, slotId)))
      .limit(1);
    if (dupSlot.length) throw new BookingError("DuplicateBooking", "You already have a booking for this slot.");

    // one active (non-cancelled) booking per procurement window
    const dupWindow = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.farmerId, userId),
          eq(bookings.procurementWindowId, slot.procurementWindowId),
          ne(bookings.status, "cancelled")
        )
      )
      .limit(1);
    if (dupWindow.length)
      throw new BookingError(
        "DuplicateWindowBooking",
        "You already have a booking for this procurement window. Open My Bookings to view it."
      );

    const newCount = slot.bookedCount + 1;
    const nowFull = newCount >= slot.capacity;
    await tx
      .update(slots)
      .set({ bookedCount: newCount, status: nowFull ? "full" : "open", updatedAt: new Date() })
      .where(eq(slots.id, slotId));

    const [inserted] = await tx
      .insert(bookings)
      .values({
        farmerId: userId,
        slotId,
        procurementWindowId: slot.procurementWindowId,
        bookingCode: generateBookingCode(),
        tokenNumber: newCount,
        status: "confirmed",
      })
      .returning();

    await audit(userId, "booking.created", "booking", inserted.id, { slotId }, tx);

    return { booking: inserted, slot, centre: { name: eligible.centreName, address: eligible.centreAddress }, nowFull };
  });

  // side effects outside the tx
  await enqueueNotification({
    userId,
    type: "booking_confirmed",
    title: "Booking confirmed",
    body: `Your booking ${booking.booking.bookingCode} at ${booking.centre.name} on ${booking.slot.slotDate} is confirmed. Token ${booking.booking.tokenNumber}.`,
    templateKey: "booking_confirmed",
    payload: {
      bookingCode: booking.booking.bookingCode,
      centreName: booking.centre.name,
      centreAddress: booking.centre.address,
      slotDate: booking.slot.slotDate,
      startTime: booking.slot.startTime,
      endTime: booking.slot.endTime,
      tokenNumber: booking.booking.tokenNumber,
    },
  });

  publish({
    type: "booking.created",
    serviceAreaId: profile.serviceAreaId,
    payload: { slotId, bookedCount: booking.slot.bookedCount + 1, capacity: booking.slot.capacity },
  });
  if (booking.nowFull) {
    publish({ type: "slot.full", serviceAreaId: profile.serviceAreaId, payload: { slotId } });
  }

  return booking.booking;
}

export async function cancelBooking(userId: string, bookingId: string, actorIsAdmin = false, reason?: string) {
  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ booking: bookings, slot: slots })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(eq(bookings.id, bookingId))
      .for("update");

    if (!row) throw new BookingError("NotFound", "Booking not found.", 404);
    if (!actorIsAdmin && row.booking.farmerId !== userId)
      throw new BookingError("Forbidden", "You can only cancel your own booking.", 403);
    if (row.booking.status === "cancelled")
      throw new BookingError("AlreadyCancelled", "This booking is already cancelled.");
    if (["arrived", "procured", "payment_initiated", "payment_completed"].includes(row.booking.status))
      throw new BookingError(
        "CancellationFailed",
        "We could not cancel this booking. It may already be in use or outside the cancellation window."
      );

    await tx
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    const newCount = Math.max(0, row.slot.bookedCount - 1);
    const newStatus = row.slot.status === "full" && newCount < row.slot.capacity ? "open" : row.slot.status;
    await tx
      .update(slots)
      .set({ bookedCount: newCount, status: newStatus, updatedAt: new Date() })
      .where(eq(slots.id, row.slot.id));

    await audit(userId, "booking.cancelled", "booking", bookingId, { reason, actorIsAdmin }, tx);
    return row;
  });

  await enqueueNotification({
    userId: result.booking.farmerId,
    type: "booking_cancelled",
    title: "Booking cancelled",
    body: `Your booking ${result.booking.bookingCode} has been cancelled${reason ? `: ${reason}` : "."}`,
    templateKey: "booking_cancelled",
    payload: { bookingCode: result.booking.bookingCode, slotDate: result.slot.slotDate, reason },
  });
  publish({ type: "booking.cancelled", payload: { slotId: result.slot.id } });

  return { ok: true };
}
