import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { env } from "../config.js";

type NeonWebhookBody = {
  event: string;
  data?: Record<string, unknown>;
};

const webhooksRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/webhooks/neon", async (request, reply) => {
    const body = request.body as NeonWebhookBody;
    request.log.info({ event: body.event, data: body.data }, "Neon auth webhook received");

    if (body.event === "send.otp" && body.data) {
      const { phoneNumber, code, deliveryPreference } = body.data as {
        phoneNumber?: string;
        code?: string;
        deliveryPreference?: string;
      };

      if (phoneNumber && code) {
        // TODO: integrate real SMS provider
        request.log.info(
          { phoneNumber, code, deliveryPreference },
          "OTP to be delivered (provider not configured - mock)"
        );
      }
    }

    if (body.event === "user.created" && body.data) {
      request.log.info({ user: body.data }, "Neon user created");
    }

    return reply.send({ received: true });
  });

  app.get("/webhooks/neon/spec", async () => ({
    endpoint: `${env.PUBLIC_API_URL}/webhooks/neon`,
    method: "POST",
    events: ["send.otp", "user.created", "phone_number.verified"],
    note: "Signature verification not yet implemented. The handler will forward send.otp to the configured SMS provider once credentials are supplied.",
  }));
};

export default fp(webhooksRoute, { name: "webhooks" });
