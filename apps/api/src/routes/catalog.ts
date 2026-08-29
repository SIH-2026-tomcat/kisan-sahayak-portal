import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db, serviceAreas, areaPincodes, centres, centreAreaMap, slots, procurementWindows } from "@kisan/db";
import { and, eq, inArray } from "drizzle-orm";
import { lookupPincode } from "../lib/pincode.js";

const catalog: FastifyPluginAsync = async (app) => {
  // pincode -> service area + eligible centres
  app.get("/areas/by-pincode/:pincode", async (request, reply) => {
    const { pincode } = z.object({ pincode: z.string().regex(/^\d{6}$/) }).parse(request.params);

    const [area] = await db
      .select({ serviceArea: serviceAreas })
      .from(areaPincodes)
      .innerJoin(serviceAreas, eq(areaPincodes.serviceAreaId, serviceAreas.id))
      .where(eq(areaPincodes.pincode, pincode))
      .limit(1);

    if (!area) {
      const guess = lookupPincode(pincode);
      return reply.status(404).send({
        error: "PincodeNotCovered",
        message:
          "We do not have centre coverage mapped for this pincode yet. You can continue registration, but slot booking may not be available until an eligible centre is configured.",
        suggestion: guess,
      });
    }

    const eligibleCentres = await db
      .select({ centre: centres, priority: centreAreaMap.priority })
      .from(centreAreaMap)
      .innerJoin(centres, eq(centreAreaMap.centreId, centres.id))
      .where(and(eq(centreAreaMap.serviceAreaId, area.serviceArea.id), eq(centres.status, "active")))
      .orderBy(centreAreaMap.priority);

    return {
      serviceArea: area.serviceArea,
      centres: eligibleCentres.map((r) => r.centre),
    };
  });

  app.get("/centres", async (request, reply) => {
    const { serviceAreaId } = z.object({ serviceAreaId: z.string().uuid().optional() }).parse(request.query);
    if (!serviceAreaId) {
      return reply.status(400).send({ error: "MissingServiceArea", message: "serviceAreaId is required." });
    }
    const rows = await db
      .select({ centre: centres })
      .from(centreAreaMap)
      .innerJoin(centres, eq(centreAreaMap.centreId, centres.id))
      .where(and(eq(centreAreaMap.serviceAreaId, serviceAreaId), eq(centres.status, "active")))
      .orderBy(centreAreaMap.priority);
    return { centres: rows.map((r) => r.centre) };
  });

  // live slot availability, tab-filtered
  app.get("/slots", async (request, reply) => {
    const q = z
      .object({
        serviceAreaId: z.string().uuid(),
        tab: z.enum(["open", "upcoming", "closed"]).default("open"),
      })
      .safeParse(request.query);
    if (!q.success) {
      return reply.status(400).send({ error: "InvalidQuery", message: "serviceAreaId is required." });
    }
    const { serviceAreaId, tab } = q.data;

    const centreIds = (
      await db
        .select({ id: centreAreaMap.centreId })
        .from(centreAreaMap)
        .where(eq(centreAreaMap.serviceAreaId, serviceAreaId))
    ).map((r) => r.id);
    if (centreIds.length === 0) return { items: [] };

    const statusFilter =
      tab === "open"
        ? inArray(slots.status, ["open"])
        : tab === "upcoming"
          ? inArray(slots.status, ["scheduled", "draft"])
          : inArray(slots.status, ["closed", "full", "cancelled"]);

    const rows = await db
      .select({ slot: slots, centre: centres, window: procurementWindows })
      .from(slots)
      .innerJoin(centres, eq(slots.centreId, centres.id))
      .innerJoin(procurementWindows, eq(slots.procurementWindowId, procurementWindows.id))
      .where(and(inArray(slots.centreId, centreIds), statusFilter))
      .orderBy(slots.slotDate, slots.startTime);

    return {
      items: rows.map((r) => ({
        ...r.slot,
        remaining: Math.max(0, r.slot.capacity - r.slot.bookedCount),
        centre: r.centre,
        procurementWindow: r.window,
      })),
    };
  });

  // current open procurement window details
  app.get("/procurement/current", async () => {
    const [win] = await db
      .select()
      .from(procurementWindows)
      .where(eq(procurementWindows.status, "open"))
      .orderBy(procurementWindows.startDate)
      .limit(1);
    return { window: win ?? null };
  });
};

export default catalog;
