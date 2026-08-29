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
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
