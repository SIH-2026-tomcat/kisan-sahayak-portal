import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { db, users } from "@kisan/db";
import { eq, or } from "drizzle-orm";
import { env } from "../config";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const mobileSendSchema = z.object({
  mobile: z.string().min(10),
});

const mobileVerifySchema = z.object({
  mobile: z.string().min(10),
  code: z.string().length(6),
});

async function getUserByNeonOrEmail(externalId: string, email: string) {
  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.externalAuthId, externalId), eq(users.email, email)))
    .limit(1);
  return existing[0] ?? null;
}

async function signToken(payload: { sub: string; email: string; role: string }) {
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function neonFetch(path: string, body: unknown) {
  const res = await fetch(`${env.NEON_AUTH_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: env.PUBLIC_APP_URL,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { user?: { id: string; email: string; name?: string }; token?: string; message?: string; code?: string };
  if (!res.ok) {
    const err = new Error(data.message || `Neon auth ${path} failed`);
    (err as Error & { statusCode: number; code?: string }).statusCode = res.status;
    (err as Error & { code?: string }).code = data.code;
    throw err;
  }
  return data;
}

async function syncUserToDb(neonUser: { id: string; email: string; name?: string | null }) {
  const existing = await getUserByNeonOrEmail(neonUser.id, neonUser.email);
  const role =
    env.ADMIN_EMAIL && neonUser.email === env.ADMIN_EMAIL
      ? "super_admin"
      : existing?.role ?? "farmer";

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        externalAuthId: neonUser.id,
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      externalAuthId: neonUser.id,
      email: neonUser.email,
      mobile: "",
      role,
      language: "en",
      emailVerifiedAt: new Date(),
    })
    .returning();
  return created;
}

const authPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/auth/register", async (request, reply) => {
    const body = authSchema.parse(request.body);

    const { user: neonUser } = await neonFetch("sign-up/email", {
      email: body.email,
      password: body.password,
      name: body.name,
    });

    if (!neonUser) {
      return reply.status(500).send({ error: "AuthFailed", message: "No user returned from auth provider." });
    }

    const dbUser = await syncUserToDb(neonUser);
    const token = await signToken({ sub: dbUser.id, email: dbUser.email, role: dbUser.role });

    return reply.send({ token, user: dbUser });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = authSchema.parse(request.body);

    const { user: neonUser } = await neonFetch("sign-in/email", {
      email: body.email,
      password: body.password,
    });

    if (!neonUser) {
      return reply.status(500).send({ error: "AuthFailed", message: "No user returned from auth provider." });
    }

    const dbUser = await syncUserToDb(neonUser);
    const token = await signToken({ sub: dbUser.id, email: dbUser.email, role: dbUser.role });

    return reply.send({ token, user: dbUser });
  });

  app.get("/auth/me", async (request, reply) => {
    const user = await requireUser(request);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized", message: "Please sign in." });
    }
    return { user };
  });

  app.post("/auth/mobile/send-otp", async (request, reply) => {
    const body = mobileSendSchema.parse(request.body);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: send via SMS provider or Neon webhook
    request.log.info({ mobile: body.mobile, code }, "Mobile OTP generated (mock)");

    return reply.send({
      message: "OTP generated for demo. Check API logs or provide an SMS provider for real delivery.",
    });
  });

  app.post("/auth/mobile/verify-otp", async (request, reply) => {
    const body = mobileVerifySchema.parse(request.body);
    // In a real implementation this compares the stored hashed OTP
    return reply.send({
      verified: false,
      message: "OTP verification needs a real SMS provider or stored code. Provide provider details to enable this.",
    });
  });
};

export async function requireUser(request: FastifyRequest) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  try {
    const secret = new TextEncoder().encode(env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const user = await db.select().from(users).where(eq(users.id, payload.sub as string)).limit(1);
    return user[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const user = await requireUser(request);
  if (!user) {
    return reply.status(401).send({ error: "Unauthorized", message: "Please sign in to continue." });
  }
  request.user = user;
}

export default fp(authPlugin, { name: "auth" });
