import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.js";

let appPromise: Promise<Awaited<ReturnType<typeof buildApp>>> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await buildApp();
      await app.ready();
      return app;
    })();
  }
  const app = await appPromise;
  app.server.emit("request", req, res);
}
