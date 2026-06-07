import Fastify from "fastify";
import formbody from "@fastify/formbody";
import twilio from "twilio";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env, twilioConfigured } from "./env.js";

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
});

// Twilio posts webhooks as application/x-www-form-urlencoded — parse it.
await app.register(formbody);

/**
 * Optional guard: confirm a request genuinely came from Twilio.
 * Off until VALIDATE_TWILIO_SIGNATURE=true AND we have an auth token + public URL.
 */
function validateTwilioSignature(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void,
) {
  if (!env.VALIDATE_TWILIO_SIGNATURE) return done();

  if (!env.TWILIO_AUTH_TOKEN || !env.PUBLIC_BASE_URL) {
    request.log.warn(
      "Signature validation enabled but TWILIO_AUTH_TOKEN / PUBLIC_BASE_URL missing — skipping",
    );
    return done();
  }

  const signature = (request.headers["x-twilio-signature"] as string) ?? "";
  const url = env.PUBLIC_BASE_URL.replace(/\/$/, "") + request.url;
  const params = (request.body ?? {}) as Record<string, string>;

  const valid = twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
  if (!valid) {
    request.log.warn({ url }, "Rejected request with invalid Twilio signature");
    reply.code(403).send("Invalid Twilio signature");
    return;
  }
  done();
}

// --- Health / status -------------------------------------------------------
// Railway pings /health; / is a friendly landing for humans hitting the URL.
app.get("/health", async () => ({
  ok: true,
  service: "mello-voice",
  env: env.NODE_ENV,
  twilioConfigured,
}));

app.get("/", async () => ({ service: "mello-voice", status: "up" }));

// --- Twilio incoming-call webhook ------------------------------------------
// Twilio hits this the moment the number rings. We answer with TwiML that
// reads a hello line, then hang up. This proves the phone → server path.
app.post(
  "/voice/incoming",
  { preHandler: validateTwilioSignature },
  async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, string>;
    const from = body.From ?? "unknown";
    const to = body.To ?? "unknown";
    const callSid = body.CallSid ?? "unknown";

    request.log.info({ from, to, callSid }, "Incoming call");

    const twiml = new twilio.twiml.VoiceResponse();
    // Polly.Aditi = Indian-English voice. This is a placeholder greeting —
    // Sarvam STT/TTS replaces this in Step 4–6.
    twiml.say(
      { voice: "Polly.Aditi", language: "en-IN" },
      "Hello, can you hear me? This is Mello.",
    );
    twiml.hangup();

    reply.header("Content-Type", "text/xml").send(twiml.toString());
  },
);

// --- Boot ------------------------------------------------------------------
try {
  await app.listen({ port: env.PORT, host: env.HOST });
  if (!twilioConfigured) {
    app.log.warn(
      "Twilio not configured yet (no SID/auth token). Server is up; fill in .env.local when KYC + auth clear.",
    );
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
