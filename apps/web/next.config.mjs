import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Local dev: pull shared secrets from the monorepo-root .env.local.
// On Vercel these come from project / build env vars instead.
const here = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(here, "../../.env.local");
if (existsSync(rootEnv)) loadEnv({ path: rootEnv });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  env: {
    API_URL: process.env.PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || "http://localhost:3000",
  },
};

export default nextConfig;
