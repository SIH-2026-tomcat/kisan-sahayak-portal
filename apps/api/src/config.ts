import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load the monorepo-root .env.local regardless of the process CWD.
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../../.env.local") });
config({ path: resolve(here, "../../.env.local") });

import { z } from "zod";

const optionalString = z.union([z.string().min(1), z.literal("")]).optional();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEON_AUTH_URL: z.string().url(),
  NEON_AUTH_JWKS_URL: z.string().url(),
  NEON_AUTH_WEBHOOK_SECRET: optionalString,
  PORT: z.string().default("3001"),
  HOST: z.string().default("0.0.0.0"),
  // Comma-separated list of allowed browser origins for CORS.
  PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
  AUTH_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.union([z.string().email(), z.literal("")]).optional(),
  EMAIL_REPLY_TO: z.union([z.string().email(), z.literal("")]).optional(),
  ADMIN_EMAIL: z.union([z.string().email(), z.literal("")]).optional(),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  CLOUDINARY_AADHAAR_FOLDER: z.string().optional().default("kisan-sahayak/aadhaar"),
});

export const env = envSchema.parse(process.env);

export const allowedOrigins = env.PUBLIC_APP_URL.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
