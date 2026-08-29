import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db, notifications, announcements, farmerProfiles } from "@kisan/db";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const route: FastifyPluginAsync = async (app) => {
  app.get("/notifications", { preHandler: [requireAuth] }, async (request) => {
    const userId = request.user!.id;
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { items: list, unread: Number(count) };
  });

  app.post("/notifications/:id/read", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, request.user!.id)))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Notification not found." });
    return { ok: true };
  });

  app.post("/notifications/read-all", { preHandler: [requireAuth] }, async (request) => {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, request.user!.id), isNull(notifications.readAt)));
    return { ok: true };
  });

  // farmer announcement feed, audience-filtered
  app.get("/announcements", { preHandler: [requireAuth] }, async (request) => {
    const [profile] = await db
      .select({ serviceAreaId: farmerProfiles.serviceAreaId })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, request.user!.id))
      .limit(1);

    const areaId = profile?.serviceAreaId ?? null;
    const rows = await db
      .select()
      .from(announcements)
      .where(
        and(
          sql`${announcements.sentAt} is not null`,
          areaId
            ? or(eq(announcements.audienceType, "all"), eq(announcements.serviceAreaId, areaId))
            : eq(announcements.audienceType, "all")
        )
      )
      .orderBy(desc(announcements.sentAt))
      .limit(30);
    return { items: rows };
  });
};

export default route;
