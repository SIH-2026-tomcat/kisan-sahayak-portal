import { config } from "dotenv";
config({ path: ".env.local" });

const RENDER_TOKEN = process.env.RENDER_TOKEN;
if (!RENDER_TOKEN) {
  console.error("RENDER_TOKEN is not set");
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${RENDER_TOKEN}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Render API ${opts.method || "GET"} ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const owners = await api("/owners?limit=20");
  const workspace = owners?.[0]?.owner;
  if (!workspace) {
    console.error("No Render workspace found");
    process.exit(1);
  }

  const ownerId = workspace.id;
  const envKeys = [
    "DATABASE_URL",
    "NEON_AUTH_URL",
    "NEON_AUTH_JWKS_URL",
    "AUTH_SECRET",
    "PUBLIC_APP_URL",
    "PUBLIC_API_URL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "EMAIL_REPLY_TO",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "CLOUDINARY_AADHAAR_FOLDER",
  ];

  const envVars = envKeys
    .map((key) => ({ key, value: process.env[key] || "" }))
    .filter((e) => e.value !== "");

  const body = {
    type: "web_service",
    name: "kisan-sahayak-api",
    ownerId,
    repo: "https://github.com/SIH-2026-tomcat/kisan-sahayak-portal",
    branch: "main",
    plan: "free",
    region: "oregon",
    serviceDetails: {
      runtime: "node",
      envVars,
      envSpecificDetails: {
        buildCommand: "npm install",
        startCommand: "npx tsx apps/api/src/index.ts",
      },
    },
  };

  console.log(`Creating Render web service in workspace ${workspace.name}...`);
  const service = await api("/services", { method: "POST", body: JSON.stringify(body) });
  console.log(JSON.stringify(service, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
