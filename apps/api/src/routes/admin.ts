import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  db,
  users,
  farmerProfiles,
  serviceAreas,
  areaPincodes,
  centres,
  centreAreaMap,
  procurementWindows,
  slots,
  bookings,
  announcements,
  auditLogs,
} from "@kisan/db";
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { maskEmail, maskMobile, maskAadhaar } from "../lib/mask.js";
import { publish } from "../lib/events.js";
import { enqueueNotification, enqueueBulk } from "../lib/notify.js";
import { cancelBooking } from "../services/booking.js";

const admin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  // ---------- Reports / dashboard ----------
  app.get("/admin/reports/summary", async () => {
    const [farmers] = await db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.role, "farmer"));
    const [activeCentres] = await db.select({ n: sql<number>`count(*)` }).from(centres).where(eq(centres.status, "active"));
    const [todayBookings] = await db
      .select({ n: sql<number>`count(*)` })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(and(eq(slots.slotDate, new Date().toISOString().split("T")[0]), sql`${bookings.status} <> 'cancelled'`));
    const [pendingPayments] = await db
      .select({ n: sql<number>`count(*)` })
      .from(bookings)
      .where(inArray(bookings.status, ["procured", "payment_initiated"]));
    const [pendingVerification] = await db
      .select({ n: sql<number>`count(*)` })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.verificationStatus, "pending"));
    return {
      registeredFarmers: Number(farmers.n),
      activeCentres: Number(activeCentres.n),
      bookingsToday: Number(todayBookings.n),
      pendingPaymentUpdates: Number(pendingPayments.n),
      pendingVerification: Number(pendingVerification.n),
    };
  });

  app.get("/admin/reports/capacity", async () => {
    const rows = await db
      .select({
        slotId: slots.id,
        centre: centres.name,
        slotDate: slots.slotDate,
        startTime: slots.startTime,
        capacity: slots.capacity,
        booked: slots.bookedCount,
        status: slots.status,
      })
      .from(slots)
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .where(gte(slots.slotDate, new Date(Date.now() - 3 * 864e5).toISOString().split("T")[0]))
      .orderBy(asc(slots.slotDate), asc(slots.startTime));
    return { items: rows };
  });

  app.get("/admin/reports/by-centre", async () => {
    const rows = await db
      .select({
        centre: centres.name,
        centreId: centres.id,
        bookings: sql<number>`count(${bookings.id})`,
        capacity: sql<number>`coalesce(sum(${slots.capacity}), 0)`,
        booked: sql<number>`coalesce(sum(${slots.bookedCount}), 0)`,
      })
      .from(centres)
      .leftJoin(slots, eq(slots.centreId, centres.id))
      .leftJoin(bookings, eq(bookings.slotId, slots.id))
      .groupBy(centres.id, centres.name);
    return { items: rows };
  });

  app.get("/admin/activity", async () => {
    const rows = await db
      .select({ log: auditLogs, actor: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(40);
    return { items: rows.map((r) => ({ ...r.log, actorEmail: r.actor ? maskEmail(r.actor) : "system" })) };
  });

  app.get("/admin/audit", async (request) => {
    const { entityType, limit } = z
      .object({ entityType: z.string().optional(), limit: z.coerce.number().min(1).max(200).default(100) })
      .parse(request.query);
    const rows = await db
      .select({ log: auditLogs, actor: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(entityType ? eq(auditLogs.entityType, entityType) : sql`true`)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    return { items: rows.map((r) => ({ ...r.log, actorEmail: r.actor ? maskEmail(r.actor) : "system" })) };
  });

  // ---------- Service areas ----------
  app.get("/admin/service-areas", async () => {
    const areas = await db.select().from(serviceAreas).orderBy(asc(serviceAreas.district));
    const pins = await db.select().from(areaPincodes);
    return {
      items: areas.map((a) => ({ ...a, pincodes: pins.filter((p) => p.serviceAreaId === a.id).map((p) => p.pincode) })),
    };
  });

  // ---------- Farmers ----------
  app.get("/admin/farmers", async (request) => {
    const q = z
      .object({
        search: z.string().optional(),
        serviceAreaId: z.string().uuid().optional(),
        verification: z.enum(["pending", "verified", "rejected"]).optional(),
        page: z.coerce.number().min(1).default(1),
      })
      .parse(request.query);
    const pageSize = 20;

    const conds = [eq(users.role, "farmer")];
    if (q.serviceAreaId) conds.push(eq(farmerProfiles.serviceAreaId, q.serviceAreaId));
    if (q.verification) conds.push(eq(farmerProfiles.verificationStatus, q.verification));
    if (q.search) {
      const s = `%${q.search}%`;
      conds.push(or(ilike(farmerProfiles.fullName, s), ilike(users.email, s), ilike(users.mobile, s))!);
    }

    const rows = await db
      .select({ user: users, profile: farmerProfiles, area: serviceAreas })
      .from(users)
      .leftJoin(farmerProfiles, eq(farmerProfiles.userId, users.id))
      .leftJoin(serviceAreas, eq(farmerProfiles.serviceAreaId, serviceAreas.id))
      .where(and(...conds))
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((q.page - 1) * pageSize);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(farmerProfiles, eq(farmerProfiles.userId, users.id))
      .where(and(...conds));

    const items = rows.map((r) => ({
      id: r.user.id,
      name: r.profile?.fullName ?? "(no profile)",
      mobileMasked: maskMobile(r.user.mobile),
      emailMasked: maskEmail(r.user.email),
      aadhaarMasked: maskAadhaar(r.profile?.aadhaarLast4),
      area: r.area ? `${r.area.district}, ${r.area.state}` : "-",
      verification: r.profile?.verificationStatus ?? "pending",
      createdAt: r.user.createdAt,
    }));
    return { items, total: Number(count), page: q.page, pageSize };
  });

  app.get("/admin/farmers/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { unmask } = z.object({ unmask: z.coerce.boolean().default(false) }).parse(request.query);
    const [row] = await db
      .select({ user: users, profile: farmerProfiles, area: serviceAreas })
      .from(users)
      .leftJoin(farmerProfiles, eq(farmerProfiles.userId, users.id))
      .leftJoin(serviceAreas, eq(farmerProfiles.serviceAreaId, serviceAreas.id))
      .where(eq(users.id, id))
      .limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Farmer not found." });

    const canUnmask = unmask && ["super_admin", "operations_admin"].includes(request.user!.role);
    if (canUnmask) {
      await audit(request.user!.id, "farmer.pii.viewed", "user", id, {});
    }
    const bk = await db
      .select({ booking: bookings, slot: slots, centre: centres })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .where(eq(bookings.farmerId, id))
      .orderBy(desc(bookings.createdAt));

    return {
      farmer: {
        id: row.user.id,
        email: canUnmask ? row.user.email : maskEmail(row.user.email),
        mobile: canUnmask ? row.user.mobile : maskMobile(row.user.mobile),
        name: row.profile?.fullName ?? null,
        address: row.profile
          ? [row.profile.addressLine1, row.profile.village, row.profile.district, row.profile.state, row.profile.pincode]
              .filter(Boolean)
              .join(", ")
          : null,
        aadhaar: canUnmask ? maskAadhaar(row.profile?.aadhaarLast4) : maskAadhaar(row.profile?.aadhaarLast4),
        aadhaarDocumentOnFile: !!row.profile?.aadhaarDocumentId,
        verification: row.profile?.verificationStatus ?? "pending",
        area: row.area ? `${row.area.district}, ${row.area.state}` : null,
        language: row.user.language,
      },
      bookings: bk.map((b) => ({ ...b.booking, slot: b.slot, centre: b.centre })),
      unmasked: canUnmask,
    };
  });

  app.post("/admin/farmers/:id/verification", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = z.object({ status: z.enum(["pending", "verified", "rejected"]) }).parse(request.body);
    const [updated] = await db
      .update(farmerProfiles)
      .set({ verificationStatus: status, updatedAt: new Date() })
      .where(eq(farmerProfiles.userId, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: "NotFound", message: "Farmer profile not found." });
    await audit(request.user!.id, "farmer.verification.updated", "farmer_profile", updated.id, { status });
    return { ok: true, status };
  });

  // ---------- Centres ----------
  const centreSchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    district: z.string().min(1),
    state: z.string().min(1),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    contactPhone: z.string().optional(),
    openingHours: z.string().optional(),
    commodities: z.array(z.string()).default([]),
    status: z.enum(["active", "paused", "closed"]).default("active"),
    serviceAreaIds: z.array(z.string().uuid()).default([]),
  });

  app.get("/admin/centres", async () => {
    const rows = await db.select().from(centres).orderBy(asc(centres.name));
    const maps = await db
      .select({ m: centreAreaMap, area: serviceAreas })
      .from(centreAreaMap)
      .innerJoin(serviceAreas, eq(centreAreaMap.serviceAreaId, serviceAreas.id));
    return {
      items: rows.map((c) => ({
        ...c,
        serviceAreas: maps.filter((m) => m.m.centreId === c.id).map((m) => ({ id: m.area.id, label: `${m.area.district}, ${m.area.state}` })),
      })),
    };
  });

  app.post("/admin/centres", async (request, reply) => {
    const body = centreSchema.parse(request.body);
    const [created] = await db
      .insert(centres)
      .values({
        name: body.name,
        address: body.address,
        pincode: body.pincode,
        district: body.district,
        state: body.state,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        contactPhone: body.contactPhone || null,
        openingHours: body.openingHours || null,
        commodities: body.commodities,
        status: body.status,
      })
      .returning();
    for (const areaId of body.serviceAreaIds) {
      await db.insert(centreAreaMap).values({ centreId: created.id, serviceAreaId: areaId, priority: 1 }).onConflictDoNothing();
    }
    await audit(request.user!.id, "centre.created", "centre", created.id, { name: created.name });
    return reply.status(201).send({ centre: created });
  });

  app.patch("/admin/centres/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = centreSchema.partial().parse(request.body);
    const [updated] = await db
      .update(centres)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.pincode !== undefined ? { pincode: body.pincode } : {}),
        ...(body.district !== undefined ? { district: body.district } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.latitude !== undefined ? { latitude: body.latitude || null } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude || null } : {}),
        ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone || null } : {}),
        ...(body.openingHours !== undefined ? { openingHours: body.openingHours || null } : {}),
        ...(body.commodities !== undefined ? { commodities: body.commodities } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(centres.id, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: "NotFound", message: "Centre not found." });

    if (body.serviceAreaIds) {
      await db.delete(centreAreaMap).where(eq(centreAreaMap.centreId, id));
      for (const areaId of body.serviceAreaIds) {
        await db.insert(centreAreaMap).values({ centreId: id, serviceAreaId: areaId, priority: 1 }).onConflictDoNothing();
      }
    }
    await audit(request.user!.id, "centre.updated", "centre", id, {});
    if (body.status === "closed") {
      publish({ type: "slot.closed", payload: { centreId: id } });
    }
    return { centre: updated };
  });

  // ---------- Slots ----------
  const slotSchema = z.object({
    centreId: z.string().uuid(),
    procurementWindowId: z.string().uuid(),
    slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    capacity: z.coerce.number().int().positive("Capacity must be a positive whole number."),
    publish: z.boolean().default(false),
  });

  app.get("/admin/procurement-windows", async () => {
    const rows = await db.select().from(procurementWindows).orderBy(desc(procurementWindows.year));
    return { items: rows };
  });

  app.get("/admin/slots", async (request) => {
    const { centreId } = z.object({ centreId: z.string().uuid().optional() }).parse(request.query);
    const rows = await db
      .select({ slot: slots, centre: centres, window: procurementWindows })
      .from(slots)
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .innerJoin(procurementWindows, eq(slots.procurementWindowId, procurementWindows.id))
      .where(centreId ? eq(slots.centreId, centreId) : sql`true`)
      .orderBy(desc(slots.slotDate), asc(slots.startTime));
    return {
      items: rows.map((r) => ({
        ...r.slot,
        remaining: Math.max(0, r.slot.capacity - r.slot.bookedCount),
        centre: r.centre,
        procurementWindow: r.window,
      })),
    };
  });

  app.post("/admin/slots", async (request, reply) => {
    const body = slotSchema.parse(request.body);
    if (body.endTime <= body.startTime) {
      return reply.status(400).send({ error: "InvalidTime", message: "End time must be later than start time." });
    }
    const overlap = await db
      .select({ id: slots.id })
      .from(slots)
      .where(
        and(
          eq(slots.centreId, body.centreId),
          eq(slots.slotDate, body.slotDate),
          sql`${slots.startTime} < ${body.endTime} and ${slots.endTime} > ${body.startTime}`,
          sql`${slots.status} <> 'cancelled'`
        )
      );
    const [created] = await db
      .insert(slots)
      .values({
        centreId: body.centreId,
        procurementWindowId: body.procurementWindowId,
        slotDate: body.slotDate,
        startTime: body.startTime,
        endTime: body.endTime,
        capacity: body.capacity,
        status: body.publish ? "open" : "draft",
        publishAt: body.publish ? new Date() : null,
      })
      .returning();
    await audit(request.user!.id, "slot.created", "slot", created.id, { published: body.publish });

    if (body.publish) {
      await notifyServiceAreaSlotReleased(created.centreId, created.id);
    }
    return reply.status(201).send({ slot: created, overlapWarning: overlap.length > 0 });
  });

  app.post("/admin/slots/:id/publish", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [updated] = await db
      .update(slots)
      .set({ status: "open", publishAt: new Date(), updatedAt: new Date() })
      .where(and(eq(slots.id, id), inArray(slots.status, ["draft", "scheduled"])))
      .returning();
    if (!updated) return reply.status(409).send({ error: "PublishConflict", message: "The slot changed while you were editing. Refresh before publishing." });
    await audit(request.user!.id, "slot.published", "slot", id, {});
    await notifyServiceAreaSlotReleased(updated.centreId, id);
    return { slot: updated };
  });

  app.post("/admin/slots/:id/close", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [updated] = await db.update(slots).set({ status: "closed", updatedAt: new Date() }).where(eq(slots.id, id)).returning();
    if (!updated) return reply.status(404).send({ error: "NotFound", message: "Slot not found." });
    await audit(request.user!.id, "slot.closed", "slot", id, {});
    publish({ type: "slot.closed", payload: { slotId: id } });
    return { slot: updated };
  });

  app.post("/admin/slots/:id/cancel", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const affected = await db
      .select({ farmerId: bookings.farmerId, code: bookings.bookingCode })
      .from(bookings)
      .where(and(eq(bookings.slotId, id), sql`${bookings.status} <> 'cancelled'`));
    const [updated] = await db.update(slots).set({ status: "cancelled", updatedAt: new Date() }).where(eq(slots.id, id)).returning();
    if (!updated) return reply.status(404).send({ error: "NotFound", message: "Slot not found." });
    for (const b of affected) {
      await enqueueNotification({
        userId: b.farmerId,
        type: "centre_closed",
        title: "Your booking slot was cancelled",
        body: `The slot for booking ${b.code} has been cancelled by the centre. Please rebook when new slots are published.`,
        templateKey: "centre_closed",
        payload: { bookingCode: b.code, slotDate: updated.slotDate },
      });
    }
    await audit(request.user!.id, "slot.cancelled", "slot", id, { affected: affected.length });
    publish({ type: "slot.closed", payload: { slotId: id } });
    return { slot: updated, affected: affected.length };
  });

  // ---------- Announcements ----------
  app.get("/admin/announcements", async () => {
    const rows = await db
      .select({ a: announcements, area: serviceAreas, creator: users.email })
      .from(announcements)
      .leftJoin(serviceAreas, eq(announcements.serviceAreaId, serviceAreas.id))
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .orderBy(desc(announcements.createdAt));
    return {
      items: rows.map((r) => ({
        ...r.a,
        areaLabel: r.area ? `${r.area.district}, ${r.area.state}` : null,
        createdByEmail: r.creator ? maskEmail(r.creator) : null,
      })),
    };
  });

  app.post("/admin/announcements", async (request, reply) => {
    const body = z
      .object({
        title: z.string().min(1).max(160),
        message: z.string().min(1).max(2000),
        audienceType: z.enum(["all", "service_area", "active_bookings"]),
        serviceAreaId: z.string().uuid().optional(),
        channels: z.array(z.enum(["in_app", "email"])).min(1),
        sendNow: z.boolean().default(true),
      })
      .parse(request.body);

    if (body.audienceType === "service_area" && !body.serviceAreaId) {
      return reply.status(400).send({ error: "MissingArea", message: "Select a service area for this audience." });
    }

    const [created] = await db
      .insert(announcements)
      .values({
        title: body.title,
        message: body.message,
        audienceType: body.audienceType,
        serviceAreaId: body.serviceAreaId ?? null,
        sendChannels: body.channels,
        createdBy: request.user!.id,
        scheduledAt: body.sendNow ? null : new Date(),
        sentAt: body.sendNow ? new Date() : null,
      })
      .returning();

    let recipientCount = 0;
    if (body.sendNow) {
      const recipientIds = await resolveAudience(body.audienceType, body.serviceAreaId);
      recipientCount = recipientIds.length;
      if (recipientCount === 0) {
        return reply.status(400).send({ error: "NoRecipients", message: "There are no eligible recipients for the selected audience." });
      }
      await enqueueBulk(recipientIds, {
        type: "announcement",
        title: body.title,
        body: body.message,
        templateKey: "announcement",
        channels: body.channels,
        payload: { title: body.title, message: body.message },
      });
      publish({ type: "announcement.sent", serviceAreaId: body.serviceAreaId ?? null, payload: { title: body.title } });
    }
    await audit(request.user!.id, "announcement.created", "announcement", created.id, { recipientCount, sent: body.sendNow });
    return reply.status(201).send({ announcement: created, recipientCount });
  });

  // ---------- Bookings ops (status + mocked payment) ----------
  app.get("/admin/bookings", async (request) => {
    const { status } = z.object({ status: z.string().optional() }).parse(request.query);
    const rows = await db
      .select({ booking: bookings, slot: slots, centre: centres, farmer: farmerProfiles.fullName, email: users.email })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .innerJoin(users, eq(bookings.farmerId, users.id))
      .leftJoin(farmerProfiles, eq(farmerProfiles.userId, users.id))
      .where(status ? eq(bookings.status, status as any) : sql`true`)
      .orderBy(desc(bookings.createdAt))
      .limit(100);
    return {
      items: rows.map((r) => ({
        ...r.booking,
        slot: r.slot,
        centre: r.centre,
        farmerName: r.farmer ?? "-",
        farmerEmailMasked: maskEmail(r.email),
      })),
    };
  });

  app.post("/admin/bookings/:id/status", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = z.object({ status: z.enum(["arrived", "procured"]) }).parse(request.body);
    const [updated] = await db.update(bookings).set({ status, updatedAt: new Date() }).where(eq(bookings.id, id)).returning();
    if (!updated) return reply.status(404).send({ error: "NotFound", message: "Booking not found." });
    await audit(request.user!.id, `booking.${status}`, "booking", id, {});
    if (status === "procured") {
      const [ctx] = await db
        .select({ centre: centres.name })
        .from(bookings)
        .innerJoin(slots, eq(bookings.slotId, slots.id))
        .innerJoin(centres, eq(slots.centreId, centres.id))
        .where(eq(bookings.id, id));
      await enqueueNotification({
        userId: updated.farmerId,
        type: "procurement_update",
        title: "Procurement recorded",
        body: `Your produce has been received at ${ctx?.centre ?? "the centre"}.`,
        templateKey: "procurement_update",
        payload: { bookingCode: updated.bookingCode, centreName: ctx?.centre, status: "received" },
      });
    }
    return { booking: updated };
  });

  app.post("/admin/bookings/:id/payment", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status, reference } = z
      .object({
        status: z.enum(["payment_initiated", "payment_completed", "payment_failed"]),
        reference: z.string().max(64).optional(),
      })
      .parse(request.body);
    const [updated] = await db
      .update(bookings)
      .set({ status, paymentReference: reference ?? null, paymentUpdatedAt: new Date(), updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: "NotFound", message: "Booking not found." });
    await audit(request.user!.id, "booking.payment.updated", "booking", id, { status, reference });
    await enqueueNotification({
      userId: updated.farmerId,
      type: "payment_update",
      title: "Payment update",
      body: `Payment status for booking ${updated.bookingCode}: ${status.replace("payment_", "")}.`,
      templateKey: "payment_update",
      payload: { bookingCode: updated.bookingCode, status: status.replace("payment_", ""), reference },
    });
    return { booking: updated };
  });

  app.post("/admin/bookings/:id/cancel", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { reason } = z.object({ reason: z.string().max(280).optional() }).parse(request.body ?? {});
    try {
      await cancelBooking(request.user!.id, id, true, reason);
      return { ok: true };
    } catch (err: any) {
      return reply.status(err.status ?? 500).send({ error: err.code ?? "CancellationFailed", message: err.message });
    }
  });
};

// ---------- helpers ----------
async function resolveAudience(audienceType: string, serviceAreaId?: string): Promise<string[]> {
  if (audienceType === "all") {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, "farmer"));
    return rows.map((r) => r.id);
  }
  if (audienceType === "service_area" && serviceAreaId) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(farmerProfiles, eq(farmerProfiles.userId, users.id))
      .where(and(eq(users.role, "farmer"), eq(farmerProfiles.serviceAreaId, serviceAreaId)));
    return rows.map((r) => r.id);
  }
  if (audienceType === "active_bookings") {
    const rows = await db
      .selectDistinct({ id: bookings.farmerId })
      .from(bookings)
      .where(sql`${bookings.status} not in ('cancelled')`);
    return rows.map((r) => r.id);
  }
  return [];
}

async function notifyServiceAreaSlotReleased(centreId: string, slotId: string) {
  const areas = await db
    .select({ areaId: centreAreaMap.serviceAreaId, label: serviceAreas.district })
    .from(centreAreaMap)
    .innerJoin(serviceAreas, eq(centreAreaMap.serviceAreaId, serviceAreas.id))
    .where(eq(centreAreaMap.centreId, centreId));
  for (const area of areas) {
    const farmers = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(farmerProfiles, eq(farmerProfiles.userId, users.id))
      .where(and(eq(users.role, "farmer"), eq(farmerProfiles.serviceAreaId, area.areaId)));
    await enqueueBulk(
      farmers.map((f) => f.id),
      {
        type: "slot_released",
        title: "New slots released",
        body: `New procurement slots for ${area.label} have been released. Booking is open now.`,
        templateKey: "slot_released",
        payload: { areaName: area.label },
      }
    );
    publish({ type: "slot.published", serviceAreaId: area.areaId, payload: { slotId } });
  }
}

export default admin;
