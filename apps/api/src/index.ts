import "./config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config";
import { db, serviceAreas, areaPincodes, centres, centreAreaMap, slots, procurementWindows } from "@kisan/db";
import { eq, and, inArray, gt, lte, sql } from "drizzle-orm";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: env.PUBLIC_APP_URL,
  credentials: true,
});

app.get("/health", async () => {
  return { status: "ok", env: env.PUBLIC_APP_URL };
});

app.get("/areas/by-pincode/:pincode", async (request, reply) => {
  const { pincode } = request.params as { pincode: string };

  const areaRow = await db
    .select({ serviceArea: serviceAreas })
    .from(areaPincodes)
    .innerJoin(serviceAreas, eq(areaPincodes.serviceAreaId, serviceAreas.id))
    .where(eq(areaPincodes.pincode, pincode))
    .limit(1);

  if (areaRow.length === 0) {
    return reply.status(404).send({
      error: "PincodeNotFound",
      message: "We do not have centre coverage mapped for this pincode yet.",
    });
  }

  const serviceArea = areaRow[0].serviceArea;

  const eligibleCentres = await db
    .select({
      centre: centres,
      priority: centreAreaMap.priority,
    })
    .from(centreAreaMap)
    .innerJoin(centres, eq(centreAreaMap.centreId, centres.id))
    .where(and(eq(centreAreaMap.serviceAreaId, serviceArea.id), eq(centres.status, "active")));

  return {
    serviceArea,
    centres: eligibleCentres.map((row) => row.centre),
  };
});

app.get("/slots", async (request, reply) => {
  const { serviceAreaId, status = "open" } = request.query as { serviceAreaId?: string; status?: string };

  if (!serviceAreaId) {
    return reply.status(400).send({
      error: "MissingServiceArea",
      message: "serviceAreaId is required",
    });
  }

  const openSlots = await db
    .select({
      slot: slots,
      centre: centres,
      window: procurementWindows,
    })
    .from(slots)
    .innerJoin(centres, eq(slots.centreId, centres.id))
    .innerJoin(centreAreaMap, eq(centreAreaMap.centreId, centres.id))
    .innerJoin(procurementWindows, eq(slots.procurementWindowId, procurementWindows.id))
    .where(
      and(
        eq(centreAreaMap.serviceAreaId, serviceAreaId),
        eq(slots.status, status as any)
      )
    );

  return {
    items: openSlots.map((row) => ({
      ...row.slot,
      centre: row.centre,
      procurementWindow: row.window,
    })),
  };
});

app.get("/test/db", async () => {
  const result = await db.select({ count: sql<number>`count(*)` }).from(serviceAreas);
  return { count: result[0].count };
});

try {
  await app.listen({ port: parseInt(env.PORT), host: env.HOST });
  app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
