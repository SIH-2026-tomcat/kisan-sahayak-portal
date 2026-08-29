import { db, auditLogs } from "@kisan/db";

export async function audit(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
  tx?: any
) {
  const dbc = tx ?? db;
  await dbc.insert(auditLogs).values({ actorUserId, action, entityType, entityId, metadata });
}
