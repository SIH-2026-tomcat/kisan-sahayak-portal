import { env } from "./config.js";
import { buildApp } from "./app.js";
import { startOutboundWorker } from "./workers/outbound.js";

const app = await buildApp();
const stopWorker = startOutboundWorker(app.log);

try {
  await app.listen({ port: parseInt(env.PORT), host: env.HOST });
  app.log.info(`Kisan Sahayak API on http://${env.HOST}:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  stopWorker();
  process.exit(1);
}
