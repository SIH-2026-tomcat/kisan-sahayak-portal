import { config } from "dotenv";
import { spawnSync } from "child_process";
config({ path: ".env.local" });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
if (!VERCEL_TOKEN) {
  console.error("VERCEL_TOKEN is not set");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["vercel", "project", "protection", "disable", "web", "--sso", "--token", VERCEL_TOKEN],
  { stdio: "inherit", shell: process.platform === "win32" }
);

process.exit(result.status ?? 1);
