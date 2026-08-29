import { EventEmitter } from "node:events";
import type { FastifyReply, FastifyRequest } from "fastify";
import { resolveUser } from "./auth.js";
import { db, farmerProfiles } from "@kisan/db";
import { eq } from "drizzle-orm";

export type RealtimeEvent = {
  type:
    | "slot.published"
    | "slot.updated"
    | "slot.full"
    | "slot.closed"
    | "booking.created"
    | "booking.cancelled"
    | "announcement.sent"
    | "notification.created";
  /** null = broadcast to everyone */
  serviceAreaId?: string | null;
  /** if set, only this user should receive it */
  userId?: string | null;
  payload: Record<string, unknown>;
};

const bus = new EventEmitter();
bus.setMaxListeners(0);

export function publish(event: RealtimeEvent) {
  bus.emit("event", { ...event, ts: new Date().toISOString() });
}

/** SSE endpoint handler. Farmers get events for their service area + themselves; admins get everything. */
export async function sseHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await resolveUser(request);
  if (!user) {
    return reply.status(401).send({ error: "Unauthorized", message: "Please sign in." });
  }

  const isAdmin = user.role !== "farmer";
  let serviceAreaId: string | null = null;
  if (!isAdmin) {
    const [profile] = await db
      .select({ serviceAreaId: farmerProfiles.serviceAreaId })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, user.id))
      .limit(1);
    serviceAreaId = profile?.serviceAreaId ?? null;
  }

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  reply.raw.write(`event: ready\ndata: {"ok":true}\n\n`);

  const onEvent = (event: RealtimeEvent & { ts: string }) => {
    if (event.userId && event.userId !== user.id) return;
    if (!isAdmin && !event.userId) {
      if (event.serviceAreaId && event.serviceAreaId !== serviceAreaId) return;
    }
    reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  };

  bus.on("event", onEvent);
  const heartbeat = setInterval(() => reply.raw.write(`: ping\n\n`), 25_000);

  request.raw.on("close", () => {
    clearInterval(heartbeat);
    bus.off("event", onEvent);
  });
}
