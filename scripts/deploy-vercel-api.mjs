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

const PROJECT = "kisan-sahayak-api";
const WEB_URL = process.env.NEXT_PUBLIC_APP_URL_PROD || "https://web-rust-sigma-11.vercel.app";

const ENV_KEYS = [
  "DATABASE_URL",
  "NEON_AUTH_URL",
  "NEON_AUTH_BASE_URL",
  "NEON_AUTH_JWKS_URL",
  "NEON_AUTH_WEBHOOK_SECRET",
  "INTERNAL_JWT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "ADMIN_EMAIL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_AADHAAR_FOLDER",
];

async function vapi(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...opts.headers },
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function main() {
  let { data } = await vapi("/v10/projects", {
    method: "POST",
    body: JSON.stringify({ name: PROJECT, framework: null, rootDirectory: "apps/api" }),
  });
  let projectId = data.id;
  let orgId = data.accountId;
  if (!projectId) {
    const got = await vapi(`/v9/projects/${PROJECT}`);
    projectId = got.data.id;
    orgId = got.data.accountId;
    console.log(`Using existing project ${PROJECT} (${projectId})`);
  } else {
    console.log(`Created project ${PROJECT} (${projectId})`);
  }

  const envValues = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k] || ""]));
  envValues.PUBLIC_APP_URL = WEB_URL;
  envValues.PUBLIC_API_URL = `https://${PROJECT}.vercel.app`;
  for (const [key, value] of Object.entries(envValues)) {
    if (!value) continue;
    const r = await vapi(`/v10/projects/${projectId}/env?upsert=true`, {
      method: "POST",
      body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview"] }),
    });
    console.log(`  env ${key}: ${r.status}`);
  }

  // deploy from repo root so the npm workspace is intact; rootDirectory=apps/api handles the subdir
  mkdirSync(resolve(root, ".vercel"), { recursive: true });
  writeFileSync(resolve(root, ".vercel/project.json"), JSON.stringify({ projectId, orgId }, null, 2));
  const res = spawnSync("npx", ["vercel", "deploy", "--prod", "--yes", "--token", TOKEN], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  process.exit(res.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
