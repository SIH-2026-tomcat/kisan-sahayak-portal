import { db, notifications, outboundMessages, users } from "@kisan/db";
import { eq, inArray } from "drizzle-orm";
import { publish } from "./events.js";
import type { TemplateKey } from "./email.js";

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
    await dbc.insert(outboundMessages).values({
      userId: input.userId,
      channel: "email",
      templateKey: input.templateKey,
      payload,
      status: "pending",
    });
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
