import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { db } from "@kisan/db";
import { slots, bookings, farmerProfiles, centreAreaMap, notifications, users, centres } from "@kisan/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../plugins/auth.js";
import crypto from "crypto";

function generateBookingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KS-";
  for (let i = 0; i < 6; i++) {
    out += chars[crypto.randomInt(chars.length)];
  }
  return out;
}

const bookingsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/bookings", { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.id;
    const list = await db
      .select({
        booking: bookings,
        slot: slots,
      })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(eq(bookings.farmerId, userId))
      .orderBy(slots.slotDate, slots.startTime);

    return {
      items: list.map((row) => ({
        ...row.booking,
        slot: row.slot,
      })),
    };
  });

  app.post("/slots/:slotId/book", { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.id;
    const { slotId } = request.params as { slotId: string };

    const [profile] = await db
      .select()
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, userId));

    if (!profile) {
      return reply.status(400).send({
        error: "ProfileRequired",
        message: "Please complete your farmer profile before booking a slot.",
      });
    }

    if (!profile.serviceAreaId) {
      return reply.status(400).send({
        error: "ServiceAreaRequired",
        message: "Your pincode is not mapped to a service area.",
      });
    }

    const [slotWithArea] = await db
      .select({
        slot: slots,
        mapId: centreAreaMap.id,
      })
      .from(slots)
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .innerJoin(centreAreaMap, eq(centreAreaMap.centreId, slots.centreId))
      .where(
        and(
          eq(slots.id, slotId),
          eq(centreAreaMap.serviceAreaId, profile.serviceAreaId),
          eq(slots.status, "open")
        )
      )
      .limit(1);

    if (!slotWithArea) {
      return reply.status(403).send({
        error: "SlotNotEligible",
        message: "This slot is not open or not in your service area.",
      });
    }

    const { slot } = slotWithArea;

    try {
      const [booking] = await db.transaction(async (tx) => {
        const [current] = await tx
          .select({
            id: slots.id,
            bookedCount: slots.bookedCount,
            capacity: slots.capacity,
            centreId: slots.centreId,
            status: slots.status,
          })
          .from(slots)
          .where(eq(slots.id, slotId))
          .for("update");

        if (!current || current.status !== "open") {
          throw new Error("SlotNoLongerAvailable");
        }

        if (current.bookedCount >= current.capacity) {
          throw new Error("SlotFull");
        }

        const existing = await tx
          .select({ id: bookings.id })
          .from(bookings)
          .where(and(eq(bookings.farmerId, userId), eq(bookings.slotId, slotId)))
          .limit(1);

        if (existing.length > 0) {
          throw new Error("DuplicateBooking");
        }

        const newBookedCount = current.bookedCount + 1;
        const newStatus = newBookedCount >= current.capacity ? "full" : current.status;

        await tx
          .update(slots)
          .set({
            bookedCount: newBookedCount,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(slots.id, slotId));

        const [inserted] = await tx
          .insert(bookings)
          .values({
            farmerId: userId,
            slotId,
            bookingCode: generateBookingCode(),
            tokenNumber: newBookedCount,
            status: "confirmed",
          })
          .returning();

        await tx.insert(notifications).values({
          userId,
          type: "booking_confirmed",
          title: "Booking confirmed",
          body: `Your slot ${slot.slotDate} has been booked. Code: ${inserted.bookingCode}`,
          metadata: { bookingId: inserted.id, slotId },
        });

        return [inserted];
      });

      return reply.send({ booking });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Booking failed";
      if (["SlotNoLongerAvailable", "SlotFull", "DuplicateBooking"].includes(message)) {
        return reply.status(409).send({ error: message, message });
      }
      request.log.error(err);
      return reply.status(500).send({ error: "BookingFailed", message: "Could not complete booking. Please try again." });
    }
  });
};

export default fp(bookingsRoute, { name: "bookings" });
