import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";
import { db, users } from "@kisan/db";
import { eq } from "drizzle-orm";
import { env } from "../config.js";
import { provisionUser } from "../lib/auth.js";

type NeonWebhookBody = { event?: string; type?: string; data?: Record<string, any> };

const webhooks: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/neon", async (request, reply) => {
    const body = request.body as NeonWebhookBody;
    const sig =
      (request.headers["x-neon-auth-signature"] as string) ||
      (request.headers["webhook-signature"] as string);

    // Best-effort HMAC check over the canonical JSON body when a secret is configured.
    if (env.NEON_AUTH_WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac("sha256", env.NEON_AUTH_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest("hex");
      const provided = (sig ?? "").replace(/^sha256=/, "");
      if (provided !== expected) {
        request.log.warn("neon webhook signature mismatch");
        return reply.status(401).send({ error: "InvalidSignature" });
      }
    }

    const event = body.event || body.type;
    request.log.info({ event }, "neon auth webhook");

    if ((event === "user.created" || event === "user.updated") && body.data) {
      const u = body.data.user ?? body.data;
      if (u?.id) {
        await provisionUser({ id: u.id, email: u.email, name: u.name });
        if (u.emailVerified) {
          await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.externalAuthId, u.id));
        }
      }
    }

    return reply.send({ received: true });
  });
};

export default webhooks;
