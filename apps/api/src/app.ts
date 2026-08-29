import "./config.js";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { allowedOrigins } from "./config.js";
import { sseHandler } from "./lib/events.js";

import account from "./routes/account.js";
import catalog from "./routes/catalog.js";
import farmers from "./routes/farmers.js";
import bookingsRoute from "./routes/bookings.js";
import notificationsRoute from "./routes/notifications.js";
import adminRoute from "./routes/admin.js";
import webhooksRoute from "./routes/webhooks.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true, bodyLimit: 6 * 1024 * 1024, trustProxy: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin.endsWith(o.replace(/^https?:\/\//, "")))) {
        return cb(null, true);
      }
      cb(null, false);
    },
    credentials: true,
  });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
    allowList: (req) => req.url === "/health" || req.url.startsWith("/events"),
  });

  app.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }));
  app.get("/events", sseHandler);

  await app.register(account);
  await app.register(catalog);
  await app.register(farmers);
  await app.register(bookingsRoute);
  await app.register(notificationsRoute);
  await app.register(adminRoute);
  await app.register(webhooksRoute);

  return app;
}
