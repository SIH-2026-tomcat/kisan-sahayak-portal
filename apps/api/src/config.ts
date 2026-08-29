import { config } from "dotenv";
config({ path: "../../.env.local" });

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEON_AUTH_URL: z.string().url(),
  NEON_AUTH_JWKS_URL: z.string().url(),
  PORT: z.string().default("3001"),
  HOST: z.string().default("0.0.0.0"),
  PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(1),
  RESEND_API_KEY: z.union([z.string().min(1), z.literal("")]).optional(),
  EMAIL_FROM: z.union([z.string().email(), z.literal("")]).optional(),
  EMAIL_REPLY_TO: z.union([z.string().email(), z.literal("")]).optional(),
  ADMIN_EMAIL: z.union([z.string().email(), z.literal("")]).optional(),
  CLOUDINARY_CLOUD_NAME: z.union([z.string().min(1), z.literal("")]).optional(),
  CLOUDINARY_API_KEY: z.union([z.string().min(1), z.literal("")]).optional(),
  CLOUDINARY_API_SECRET: z.union([z.string().min(1), z.literal("")]).optional(),
  CLOUDINARY_AADHAAR_FOLDER: z.string().optional().default("aadhaar_docs"),
});

export const env = envSchema.parse(process.env);
