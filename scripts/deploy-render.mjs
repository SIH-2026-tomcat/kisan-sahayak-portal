import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const RENDER_TOKEN = process.env.RENDER_TOKEN;
if (!RENDER_TOKEN) {
  console.error("RENDER_TOKEN is not set");
  process.exit(1);
}

const SERVICE_NAME = "kisan-sahayak-api";
const REPO = "https://github.com/SIH-2026-tomcat/kisan-sahayak-portal";

async function api(path, opts = {}) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${RENDER_TOKEN}`, "Content-Type": "application/json", ...opts.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Render ${opts.method || "GET"} ${path}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const ENV_KEYS = [
  "DATABASE_URL",
  "NEON_AUTH_URL",
  "NEON_AUTH_BASE_URL",
  "NEON_AUTH_JWKS_URL",
  "NEON_AUTH_WEBHOOK_SECRET",
  "INTERNAL_JWT_SECRET",
  "PUBLIC_APP_URL",
  "PUBLIC_API_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "ADMIN_EMAIL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_AADHAAR_FOLDER",
];

const envVars = ENV_KEYS.map((key) => ({ key, value: process.env[key] || "" })).filter((e) => e.value !== "");
const BUILD = "npm install && npm run build -w packages/db && npm run build -w apps/api";
const START = "node apps/api/dist/index.js";

async function main() {
  const owners = await api("/owners?limit=20");
  const ownerId = owners?.[0]?.owner?.id;
  if (!ownerId) throw new Error("No Render workspace found");

  const existing = (await api(`/services?name=${SERVICE_NAME}&limit=20`)).find?.((s) => s.service?.name === SERVICE_NAME);

  if (existing) {
    const id = existing.service.id;
    console.log(`Updating existing Render service ${id}...`);
    await api(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ serviceDetails: { envSpecificDetails: { buildCommand: BUILD, startCommand: START } } }),
    });
    await api(`/services/${id}/env-vars`, { method: "PUT", body: JSON.stringify(envVars) });
    const deploy = await api(`/services/${id}/deploys`, { method: "POST", body: JSON.stringify({ clearCache: "clear" }) });
    console.log(`Triggered deploy ${deploy.id}. URL: https://${SERVICE_NAME}.onrender.com`);
    return;
  }

  console.log("Creating Render web service...");
  const service = await api("/services", {
    method: "POST",
    body: JSON.stringify({
      type: "web_service",
      name: SERVICE_NAME,
      ownerId,
      repo: REPO,
      branch: "main",
      plan: "free",
      region: "oregon",
      serviceDetails: {
        runtime: "node",
        envVars,
        envSpecificDetails: { buildCommand: BUILD, startCommand: START },
      },
    }),
  });
  console.log(`Created ${service.service?.id}. URL: https://${SERVICE_NAME}.onrender.com`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
