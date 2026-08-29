import type { DbUser } from "../lib/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: DbUser;
  }
}

export {};
