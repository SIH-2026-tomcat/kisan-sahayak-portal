import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
config({ path: resolve(root, ".env.local") });

const TOKEN = process.env.VERCEL_TOKEN;
if (!TOKEN) {
  console.error("VERCEL_TOKEN is not set");
  process.exit(1);
}

const WEB_PROJECT = "web";
const API_URL = process.env.PUBLIC_API_URL_PROD || "https://kisan-sahayak-api.vercel.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL_PROD || "https://web-rust-sigma-11.vercel.app";

const ENV = {
  API_URL,
  PUBLIC_API_URL: API_URL,
  NEXT_PUBLIC_APP_URL: APP_URL,
  PUBLIC_APP_URL: APP_URL,
  NEON_AUTH_URL: process.env.NEON_AUTH_URL || "",
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_URL || "",
  NEON_AUTH_JWKS_URL: process.env.NEON_AUTH_JWKS_URL || "",
  NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET || "",
  INTERNAL_JWT_SECRET: process.env.INTERNAL_JWT_SECRET || "",
};

async function vapi(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...opts.headers },
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function main() {
  const { data: project } = await vapi(`/v9/projects/${WEB_PROJECT}`);
  const projectId = project.id;
  if (!projectId) throw new Error(`Vercel project "${WEB_PROJECT}" not found`);
  const orgId = project.accountId;

  for (const [key, value] of Object.entries(ENV)) {
    if (!value) continue;
    const r = await vapi(`/v10/projects/${projectId}/env?upsert=true`, {
      method: "POST",
      body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview"] }),
    });
    console.log(`  env ${key}: ${r.status}`);
  }

  mkdirSync(resolve(root, "apps/web/.vercel"), { recursive: true });
  writeFileSync(resolve(root, "apps/web/.vercel/project.json"), JSON.stringify({ projectId, orgId }, null, 2));

  console.log(`Deploying web (${APP_URL}) -> API ${API_URL}`);
  const res = spawnSync("npx", ["vercel", "deploy", "--prod", "--yes", "--token", TOKEN], {
    cwd: resolve(root, "apps/web"),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  process.exit(res.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
