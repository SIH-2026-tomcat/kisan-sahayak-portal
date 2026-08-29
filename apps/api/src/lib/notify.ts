import { db, notifications, outboundMessages, users } from "@kisan/db";
import { eq, inArray } from "drizzle-orm";
import { publish } from "./events.js";
import { sendEmail, type TemplateKey } from "./email.js";

type Channel = "in_app" | "email";

export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  templateKey: TemplateKey;
  channels?: Channel[];
  payload?: Record<string, unknown>;
  /** run inside an existing transaction */
  tx?: any;
};

/** Create in-app + queued email records for one user. Never throws for email issues. */
export async function enqueueNotification(input: NotifyInput) {
  const dbc = input.tx ?? db;
  const channels = input.channels ?? ["in_app", "email"];
  const payload = input.payload ?? {};

  if (channels.includes("in_app")) {
    await dbc.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      metadata: payload,
    });
    publish({ type: "notification.created", userId: input.userId, payload: { title: input.title } });
  }

  if (channels.includes("email")) {
    const [row] = await dbc
      .insert(outboundMessages)
      .values({ userId: input.userId, channel: "email", templateKey: input.templateKey, payload, status: "pending" })
      .returning({ id: outboundMessages.id });
    // best-effort immediate send so serverless hosts without a worker still deliver
    void deliverNow(row.id).catch(() => {});
  }
}

/** Fan an announcement / slot-release out to many users. */
export async function enqueueBulk(userIds: string[], input: Omit<NotifyInput, "userId" | "tx">) {
  if (userIds.length === 0) return;
  const rows = await db.select({ id: users.id }).from(users).where(inArray(users.id, userIds));
  for (const { id } of rows) {
    await enqueueNotification({ ...input, userId: id });
  }
}

async function deliverNow(messageId: string) {
  const [row] = await db
    .select({ msg: outboundMessages, email: users.email, language: users.language })
    .from(outboundMessages)
    .innerJoin(users, eq(outboundMessages.userId, users.id))
    .where(eq(outboundMessages.id, messageId))
    .limit(1);
  if (!row || row.msg.status !== "pending") return;
  try {
    const result = await sendEmail(row.email, row.msg.templateKey as TemplateKey, row.language, (row.msg.payload ?? {}) as any);
    await db
      .update(outboundMessages)
      .set({
        status: result.skipped ? "failed" : "sent",
        providerMessageId: result.id,
        sentAt: new Date(),
        failureReason: result.skipped ? "Email provider not configured" : null,
      })
      .where(eq(outboundMessages.id, messageId));
  } catch (err) {
    await db
      .update(outboundMessages)
      .set({ status: "failed", failureReason: err instanceof Error ? err.message : "send failed" })
      .where(eq(outboundMessages.id, messageId));
  }
}
