import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDir, "../.env.local") });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
if (!VERCEL_TOKEN) {
  console.error("VERCEL_TOKEN is not set");
  process.exit(1);
}

const PUBLIC_API_URL = process.env.PUBLIC_API_URL_PROD || "https://kisan-sahayak-api.onrender.com";
// The web deployment's own public URL (used for CORS + auth trusted origins).
const APP_URL = process.env.NEXT_PUBLIC_APP_URL_PROD || "https://kisan-sahayak-portal.vercel.app";

const runtimeEnv = {
  API_URL: PUBLIC_API_URL,
  PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: APP_URL,
  PUBLIC_APP_URL: APP_URL,
  NEON_AUTH_URL: process.env.NEON_AUTH_URL || "",
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_URL || "",
  NEON_AUTH_JWKS_URL: process.env.NEON_AUTH_JWKS_URL || "",
  NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET || "",
  INTERNAL_JWT_SECRET: process.env.INTERNAL_JWT_SECRET || "",
};

const args = ["vercel", "--yes", "--token", VERCEL_TOKEN, "--prod"];
for (const [k, v] of Object.entries(runtimeEnv)) {
  if (!v) continue;
  args.push("--build-env", `${k}=${v}`, "--env", `${k}=${v}`);
}

console.log(`Deploying web to Vercel (API ${PUBLIC_API_URL})...`);
const result = spawnSync("npx", args, {
  cwd: resolve(scriptDir, "../apps/web"),
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
