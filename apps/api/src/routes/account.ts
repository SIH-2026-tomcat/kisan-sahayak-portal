import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db, users, farmerProfiles } from "@kisan/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { maskEmail, maskMobile } from "../lib/mask.js";

const account: FastifyPluginAsync = async (app) => {
  app.get("/auth/me", { preHandler: [requireAuth] }, async (request) => {
    const u = request.user!;
    const [profile] = await db
      .select({ id: farmerProfiles.id, fullName: farmerProfiles.fullName, serviceAreaId: farmerProfiles.serviceAreaId, verificationStatus: farmerProfiles.verificationStatus })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, u.id))
      .limit(1);
    return {
      user: {
        id: u.id,
        email: u.email,
        emailMasked: maskEmail(u.email),
        mobile: u.mobile,
        mobileMasked: maskMobile(u.mobile),
        role: u.role,
        language: u.language,
        emailVerified: !!u.emailVerifiedAt,
        mobileVerified: !!u.mobileVerifiedAt,
      },
      profile: profile ?? null,
      hasProfile: !!profile,
    };
  });

  // Resolve a registered mobile number to its account email, for mobile-based login.
  // Only usable server-side by the web BFF (caller already supplied the number).
  app.get("/auth/email-for-mobile", async (request, reply) => {
    const parsed = z.object({ mobile: z.string().min(10) }).safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: "InvalidMobile", message: "Enter a 10-digit Indian mobile number." });
    const raw = parsed.data.mobile.replace(/\D/g, "").slice(-10);
    const [row] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.mobile, `+91${raw}`))
      .limit(1);
    if (!row) {
      return reply.status(404).send({ error: "UnknownAccount", message: "We could not find an account with this mobile number." });
    }
    return { email: row.email };
  });

  app.post("/auth/language", { preHandler: [requireAuth] }, async (request) => {
    const { language } = z.object({ language: z.enum(["en", "hi", "te", "bn"]) }).parse(request.body);
    await db.update(users).set({ language, updatedAt: new Date() }).where(eq(users.id, request.user!.id));
    return { ok: true, language };
  });
};

export default account;
