import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { z } from "zod";
import { db } from "@kisan/db";
import { farmerProfiles, users, serviceAreas, areaPincodes } from "@kisan/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../plugins/auth.js";

const profileSchema = z.object({
  fullName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  village: z.string().optional(),
  district: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6).max(10),
  mobile: z.string().min(10).max(15),
  aadhaarRef: z.string().min(1).optional(),
  consent: z.literal(true),
});

const farmers: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/farmers/profile", { preHandler: [requireAuth] }, async (request, reply) => {
    const body = profileSchema.parse(request.body);
    const userId = request.user!.id;

    const areaRows = await db
      .select({ serviceAreaId: areaPincodes.serviceAreaId })
      .from(areaPincodes)
      .where(eq(areaPincodes.pincode, body.pincode))
      .limit(1);

    if (areaRows.length === 0) {
      return reply.status(400).send({
        error: "InvalidPincode",
        message: "This pincode is not mapped to a service area. Please check and try again.",
      });
    }

    const serviceAreaId = areaRows[0].serviceAreaId;

    await db
      .update(users)
      .set({ mobile: body.mobile, updatedAt: new Date() })
      .where(eq(users.id, userId));

    const existing = await db.select().from(farmerProfiles).where(eq(farmerProfiles.userId, userId)).limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(farmerProfiles)
        .set({
          fullName: body.fullName,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2,
          village: body.village,
          district: body.district,
          state: body.state,
          pincode: body.pincode,
          serviceAreaId,
          aadhaarRef: body.aadhaarRef,
          consentGivenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(farmerProfiles.userId, userId))
        .returning();
      return { profile: updated, serviceAreaId };
    }

    const [created] = await db
      .insert(farmerProfiles)
      .values({
        userId,
        fullName: body.fullName,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        village: body.village,
        district: body.district,
        state: body.state,
        pincode: body.pincode,
        serviceAreaId,
        aadhaarRef: body.aadhaarRef,
        consentGivenAt: new Date(),
      })
      .returning();

    return { profile: created, serviceAreaId };
  });
};

export default fp(farmers, { name: "farmers" });
