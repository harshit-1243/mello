import Fastify from "fastify";
import formbody from "@fastify/formbody";
import websocket from "@fastify/websocket";
import twilio from "twilio";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env, twilioConfigured, sarvamConfigured } from "./env.js";
import { handleTwilioStream } from "./voice/twilioStream.js";

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
});

// Twilio posts webhooks as application/x-www-form-urlencoded — parse it.
await app.register(formbody);
// Media Streams arrive over a WebSocket — register the upgrade handler.
await app.register(websocket);

/** Build the wss:// URL Twilio should open its media stream to. */
function mediaStreamUrl(request: FastifyRequest): string {
  if (env.PUBLIC_BASE_URL) {
    return env.PUBLIC_BASE_URL.replace(/^http/, "ws").replace(/\/$/, "") + "/voice/stream";
  }
  // Fall back to the request host (works behind ngrok, which terminates TLS).
  const host = (request.headers["x-forwarded-host"] as string) ?? request.headers.host;
  return `wss://${host}/voice/stream`;
}

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
  sarvamConfigured,
}));

app.get("/", async () => ({ service: "mello-voice", status: "up" }));

// --- Twilio incoming-call webhook ------------------------------------------
// Twilio hits this the moment the number rings. We greet the caller, then open
// a Media Stream so their audio flows to us over a WebSocket for transcription.
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
    // Placeholder audible greeting — Sarvam TTS + the membership-aware greeting
    // replace this in Step 6.
    twiml.say(
      { voice: "Polly.Aditi", language: "en-IN" },
      "Hello, can you hear me? This is Mello.",
    );
    // <Connect><Stream> keeps the call open and streams the caller's audio to
    // our /voice/stream WebSocket until they hang up. We pass the caller's
    // number + call SID as Stream <Parameter>s so the brain knows who's calling
    // (the media stream itself doesn't carry the From number).
    const connect = twiml.connect();
    const stream = connect.stream({ url: mediaStreamUrl(request) });
    stream.parameter({ name: "callerPhone", value: from });
    stream.parameter({ name: "callSid", value: callSid });

    reply.header("Content-Type", "text/xml").send(twiml.toString());
  },
);

// --- Twilio Media Stream (WebSocket) ---------------------------------------
// Twilio connects here after <Connect><Stream>; we bridge the audio to Sarvam STT.
app.get("/voice/stream", { websocket: true }, (socket, request) => {
  handleTwilioStream(socket, request.log);
});

// --- Boot ------------------------------------------------------------------
try {
  await app.listen({ port: env.PORT, host: env.HOST });
  if (!twilioConfigured) {
    app.log.warn(
      "Twilio not configured yet (no SID/auth token). Server is up; fill in .env.local when KYC + auth clear.",
    );
  }
  if (!sarvamConfigured) {
    app.log.warn(
      "SARVAM_API_KEY missing — calls connect and audio streams in, but won't be transcribed. Add it to .env.local.",
    );
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
