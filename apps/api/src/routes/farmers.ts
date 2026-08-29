import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { db, farmerProfiles, users, areaPincodes, serviceAreas } from "@kisan/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { uploadAadhaarDocument, generateSignedAadhaarUrl } from "../lib/cloudinary.js";
import { audit } from "../lib/audit.js";
import { maskAadhaar } from "../lib/mask.js";

const profileSchema = z.object({
  fullName: z.string().min(1, "Please enter your name as per your identity document."),
  addressLine1: z.string().min(1, "Please enter your house / village / locality."),
  addressLine2: z.string().optional(),
  village: z.string().optional(),
  district: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode."),
  mobile: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Enter the 12-digit Aadhaar number.").optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please read the notice and confirm before continuing." }) }),
});

const farmers: FastifyPluginAsync = async (app) => {
  app.get("/farmers/profile", { preHandler: [requireAuth] }, async (request) => {
    const userId = request.user!.id;
    const [row] = await db
      .select({ profile: farmerProfiles, serviceArea: serviceAreas })
      .from(farmerProfiles)
      .leftJoin(serviceAreas, eq(farmerProfiles.serviceAreaId, serviceAreas.id))
      .where(eq(farmerProfiles.userId, userId))
      .limit(1);
    if (!row) return { profile: null };
    const { aadhaarRef, ...safe } = row.profile;
    return {
      profile: { ...safe, aadhaarMasked: maskAadhaar(row.profile.aadhaarLast4) },
      serviceArea: row.serviceArea,
      user: {
        email: request.user!.email,
        mobile: request.user!.mobile,
        emailVerifiedAt: request.user!.emailVerifiedAt,
        mobileVerifiedAt: request.user!.mobileVerifiedAt,
        language: request.user!.language,
      },
    };
  });

  app.post("/farmers/profile", { preHandler: [requireAuth] }, async (request, reply) => {
    const body = profileSchema.parse(request.body);
    const userId = request.user!.id;
    const mobile = body.mobile.startsWith("+91") ? body.mobile : `+91${body.mobile}`;

    const [areaRow] = await db
      .select({ id: areaPincodes.serviceAreaId })
      .from(areaPincodes)
      .where(eq(areaPincodes.pincode, body.pincode))
      .limit(1);
    const serviceAreaId = areaRow?.id ?? null;

    await db.update(users).set({ mobile, updatedAt: new Date() }).where(eq(users.id, userId));

    const values = {
      fullName: body.fullName,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2 ?? null,
      village: body.village ?? null,
      district: body.district,
      state: body.state,
      pincode: body.pincode,
      serviceAreaId,
      consentGivenAt: new Date(),
      updatedAt: new Date(),
      ...(body.aadhaarNumber
        ? {
            aadhaarRef: crypto.createHash("sha256").update(body.aadhaarNumber).digest("hex"),
            aadhaarLast4: body.aadhaarNumber.slice(-4),
          }
        : {}),
    };

    const [existing] = await db.select().from(farmerProfiles).where(eq(farmerProfiles.userId, userId)).limit(1);
    let profile;
    if (existing) {
      [profile] = await db.update(farmerProfiles).set(values).where(eq(farmerProfiles.userId, userId)).returning();
    } else {
      [profile] = await db.insert(farmerProfiles).values({ userId, ...values }).returning();
    }
    await audit(userId, "farmer.profile.upserted", "farmer_profile", profile.id, { serviceAreaId });

    return {
      profile: { ...profile, aadhaarRef: undefined },
      serviceAreaId,
      serviceAreaResolved: !!serviceAreaId,
    };
  });

  app.post("/farmers/aadhaar-document", { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.id;
    let fileBuffer: Buffer | undefined;
    let originalName = "aadhaar-document";
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
      return reply.status(400).send({ error: "MissingFile", message: "Please upload a JPG, PNG or PDF of your Aadhaar document." });
    }
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return reply.status(400).send({ error: "InvalidAadhaar", message: "A valid 12-digit Aadhaar number is required." });
    }

    let publicId: string;
    try {
      ({ publicId } = await uploadAadhaarDocument(userId, fileBuffer, originalName));
    } catch (err) {
      request.log.error(err);
      return reply.status(502).send({ error: "UploadFailed", message: "The document could not be uploaded. Check your connection and try again." });
    }

    const patch = {
      aadhaarRef: crypto.createHash("sha256").update(aadhaarNumber).digest("hex"),
      aadhaarLast4: aadhaarNumber.slice(-4),
      aadhaarDocumentId: publicId,
      updatedAt: new Date(),
    };
    const [existing] = await db.select({ id: farmerProfiles.id }).from(farmerProfiles).where(eq(farmerProfiles.userId, userId)).limit(1);
    if (existing) {
      await db.update(farmerProfiles).set(patch).where(eq(farmerProfiles.userId, userId));
    } else {
      // profile shell so the reference is never lost
      await db.insert(farmerProfiles).values({
        userId,
        fullName: request.user!.email ?? "Farmer",
        addressLine1: "",
        district: "",
        state: "",
        pincode: "000000",
        ...patch,
      });
    }
    await audit(userId, "farmer.aadhaar.uploaded", "farmer_profile", userId, { publicId });

    return { documentId: publicId, aadhaarLast4: aadhaarNumber.slice(-4), aadhaarMasked: maskAadhaar(aadhaarNumber.slice(-4)) };
  });

  // short-lived signed URL to view one's own uploaded document
  app.get("/farmers/aadhaar-document/url", { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.id;
    const [profile] = await db
      .select({ docId: farmerProfiles.aadhaarDocumentId })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, userId))
      .limit(1);
    if (!profile?.docId) {
      return reply.status(404).send({ error: "NoDocument", message: "No Aadhaar document on file." });
    }
    await audit(userId, "farmer.aadhaar.viewed", "farmer_profile", userId, {});
    return { url: generateSignedAadhaarUrl(profile.docId, 120), expiresInSeconds: 120 };
  });
};

export default farmers;
