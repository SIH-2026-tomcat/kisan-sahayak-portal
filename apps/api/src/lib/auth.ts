import type { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { db, users } from "@kisan/db";
import { eq, or } from "drizzle-orm";
import { env } from "../config.js";

export type DbUser = typeof users.$inferSelect;

const jwks = createRemoteJWKSet(new URL(env.NEON_AUTH_JWKS_URL));
const internalSecret = process.env.INTERNAL_JWT_SECRET
  ? new TextEncoder().encode(process.env.INTERNAL_JWT_SECRET)
  : null;

type Claims = { sub?: string; email?: string; name?: string; user?: { id?: string; email?: string; name?: string } };

async function verifyToken(token: string): Promise<{ id: string; email?: string; name?: string } | null> {
  // 1. Neon Auth JWT (EdDSA) verified against the remote JWKS
  try {
    const { payload } = await jwtVerify(token, jwks);
    return extractIdentity(payload as Claims);
  } catch {
    /* fall through */
  }
  // 2. Internal HS256 token minted by the web BFF / test harness
  if (internalSecret) {
    try {
      const { payload } = await jwtVerify(token, internalSecret, { algorithms: ["HS256"] });
      return extractIdentity(payload as Claims);
    } catch {
      /* fall through */
    }
  }
  return null;
}

function extractIdentity(payload: Claims) {
  const id = payload.sub || payload.user?.id;
  if (!id) return null;
  return {
    id,
    email: payload.email || payload.user?.email,
    name: payload.name || payload.user?.name,
  };
}

/** Find or create the local users row for a Neon Auth identity. */
export async function provisionUser(identity: { id: string; email?: string; name?: string }): Promise<DbUser> {
  const email = identity.email?.toLowerCase();
  const [existing] = await db
    .select()
    .from(users)
    .where(
      email
        ? or(eq(users.externalAuthId, identity.id), eq(users.email, email))
        : eq(users.externalAuthId, identity.id)
    )
    .limit(1);

  const wantsAdmin = !!env.ADMIN_EMAIL && email === env.ADMIN_EMAIL.toLowerCase();

  if (existing) {
    const patch: Partial<DbUser> = { updatedAt: new Date() };
    if (existing.externalAuthId !== identity.id) patch.externalAuthId = identity.id;
    if (wantsAdmin && existing.role === "farmer") patch.role = "super_admin";
    if (!existing.emailVerifiedAt && email) patch.emailVerifiedAt = new Date();
    const [updated] = await db.update(users).set(patch).where(eq(users.id, existing.id)).returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      externalAuthId: identity.id,
      email: email ?? `${identity.id}@no-email.kisan.local`,
      role: wantsAdmin ? "super_admin" : "farmer",
      language: "en",
      emailVerifiedAt: email ? new Date() : null,
    })
    .returning();
  return created;
}

export async function resolveUser(request: FastifyRequest): Promise<DbUser | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const identity = await verifyToken(header.slice(7));
  if (!identity) return null;
  return provisionUser(identity);
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const user = await resolveUser(request);
  if (!user) {
    return reply.status(401).send({ error: "Unauthorized", message: "Please sign in to continue." });
  }
  request.user = user;
}

const ADMIN_ROLES = ["operations_admin", "super_admin", "support_agent"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function requireRole(...roles: DbUser["role"][]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await resolveUser(request);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized", message: "Please sign in to continue." });
    }
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ error: "Forbidden", message: "You do not have access to this area." });
    }
    request.user = user;
  };
}

export const requireAdmin = requireRole(...ADMIN_ROLES);
