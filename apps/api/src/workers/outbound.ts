import type { FastifyBaseLogger } from "fastify";
import { db, outboundMessages, users } from "@kisan/db";
import { eq } from "drizzle-orm";
import { sendEmail, type TemplateKey } from "../lib/email.js";

const POLL_MS = 5_000;

export function startOutboundWorker(log: FastifyBaseLogger) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const pending = await db
        .select({ msg: outboundMessages, email: users.email, language: users.language })
        .from(outboundMessages)
        .innerJoin(users, eq(outboundMessages.userId, users.id))
        .where(eq(outboundMessages.status, "pending"))
        .limit(20);

      for (const row of pending) {
        try {
          const result = await sendEmail(
            row.email,
            row.msg.templateKey as TemplateKey,
            row.language,
            (row.msg.payload ?? {}) as Record<string, unknown>
          );
          await db
            .update(outboundMessages)
            .set({
              status: result.skipped ? "failed" : "sent",
              providerMessageId: result.id,
              sentAt: new Date(),
              failureReason: result.skipped ? "Email provider not configured" : null,
            })
            .where(eq(outboundMessages.id, row.msg.id));
        } catch (err) {
          const reason = err instanceof Error ? err.message : "send failed";
          await db
            .update(outboundMessages)
            .set({ status: "failed", failureReason: reason })
            .where(eq(outboundMessages.id, row.msg.id));
          log.warn({ id: row.msg.id, reason }, "outbound email failed");
        }
      }
    } catch (err) {
      log.error(err, "outbound worker tick failed");
    } finally {
      running = false;
    }
  };

  const handle = setInterval(tick, POLL_MS);
  handle.unref?.();
  log.info("outbound email worker started");
  return () => clearInterval(handle);
}
