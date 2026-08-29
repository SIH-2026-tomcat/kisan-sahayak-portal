import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db, bookings, slots, centres, procurementWindows } from "@kisan/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { bookSlot, cancelBooking, BookingError } from "../services/booking.js";

const bookingsRoute: FastifyPluginAsync = async (app) => {
  app.get("/bookings", { preHandler: [requireAuth] }, async (request) => {
    const rows = await db
      .select({ booking: bookings, slot: slots, centre: centres, window: procurementWindows })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .innerJoin(procurementWindows, eq(bookings.procurementWindowId, procurementWindows.id))
      .where(eq(bookings.farmerId, request.user!.id))
      .orderBy(desc(bookings.createdAt));
    return {
      items: rows.map((r) => ({ ...r.booking, slot: r.slot, centre: r.centre, procurementWindow: r.window })),
    };
  });

  app.get("/bookings/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db
      .select({ booking: bookings, slot: slots, centre: centres, window: procurementWindows })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .innerJoin(procurementWindows, eq(bookings.procurementWindowId, procurementWindows.id))
      .where(eq(bookings.id, id))
      .limit(1);
    if (!row || row.booking.farmerId !== request.user!.id) {
      return reply.status(404).send({ error: "NotFound", message: "Booking not found." });
    }
    return { booking: { ...row.booking, slot: row.slot, centre: row.centre, procurementWindow: row.window } };
  });

  app.post("/slots/:slotId/book", { preHandler: [requireAuth] }, async (request, reply) => {
    const { slotId } = z.object({ slotId: z.string().uuid() }).parse(request.params);
    try {
      const booking = await bookSlot(request.user!.id, slotId);
      return reply.send({ booking });
    } catch (err) {
      if (err instanceof BookingError) {
        return reply.status(err.status).send({ error: err.code, message: err.message });
      }
      request.log.error(err);
      return reply.status(500).send({ error: "BookingFailed", message: "We could not complete your booking. Please try again." });
    }
  });

  app.post("/bookings/:id/cancel", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { reason } = z.object({ reason: z.string().max(280).optional() }).parse(request.body ?? {});
    try {
      await cancelBooking(request.user!.id, id, false, reason);
      return reply.send({ ok: true });
    } catch (err) {
      if (err instanceof BookingError) {
        return reply.status(err.status).send({ error: err.code, message: err.message });
      }
      request.log.error(err);
      return reply.status(500).send({ error: "CancellationFailed", message: "We could not cancel this booking." });
    }
  });
};

export default bookingsRoute;
