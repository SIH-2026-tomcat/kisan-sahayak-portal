import { config } from "dotenv";
import { spawnSync } from "child_process";
config({ path: ".env.local" });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
if (!VERCEL_TOKEN) {
  console.error("VERCEL_TOKEN is not set");
  process.exit(1);
}

const PUBLIC_API_URL = process.env.PUBLIC_API_URL || "https://kisan-sahayak-api.onrender.com";

const args = [
  "vercel",
  "--yes",
  "--token",
  VERCEL_TOKEN,
  "--prod",
  "--build-env",
  `PUBLIC_API_URL=${PUBLIC_API_URL}`,
  "--env",
  `PUBLIC_API_URL=${PUBLIC_API_URL}`,
];

console.log(`Deploying web to Vercel with PUBLIC_API_URL=${PUBLIC_API_URL}...`);
const result = spawnSync("npx", args, {
  cwd: "apps/web",
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
