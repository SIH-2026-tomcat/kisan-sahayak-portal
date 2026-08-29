import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@kisan/db";
import { farmerProfiles, users, serviceAreas, areaPincodes } from "@kisan/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../plugins/auth.js";
import { uploadAadhaarDocument } from "../lib/cloudinary.js";

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

  app.post("/farmers/aadhaar-document", { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.id;
    let fileBuffer: Buffer | undefined;
    let originalName = "document.pdf";
    let aadhaarNumber = "";

    for await (const part of request.parts()) {
      if (part.type === "file" && part.fieldname === "document") {
        fileBuffer = await part.toBuffer();
        originalName = part.filename ?? originalName;
      } else if (part.type === "field" && part.fieldname === "aadhaarNumber") {
        aadhaarNumber = String(part.value);
      }
    }

    if (!fileBuffer) {
      return reply.status(400).send({ error: "MissingFile", message: "Aadhaar document file is required." });
    }

    if (!aadhaarNumber || aadhaarNumber.length < 12) {
      return reply.status(400).send({ error: "InvalidAadhaar", message: "A valid Aadhaar number is required." });
    }

    try {
      const { publicId } = await uploadAadhaarDocument(userId, fileBuffer, originalName);
      const aadhaarRef = crypto.createHash("sha256").update(aadhaarNumber).digest("hex");
      const aadhaarLast4 = aadhaarNumber.slice(-4);

      const [updated] = await db
        .update(farmerProfiles)
        .set({
          aadhaarRef,
          aadhaarLast4,
          aadhaarDocumentId: publicId,
          updatedAt: new Date(),
        })
        .where(eq(farmerProfiles.userId, userId))
        .returning();

      return { documentId: publicId, aadhaarLast4, updated };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "UploadFailed",
        message: "Could not upload the document. Please try again.",
      });
    }
  });
};

export default fp(farmers, { name: "farmers" });
