import Fastify from "fastify";
import formbody from "@fastify/formbody";
import websocket from "@fastify/websocket";
import twilio from "twilio";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env, twilioConfigured, sarvamConfigured, dbConfigured, apiKeyConfigured } from "./env.js";
import { handleTwilioStream } from "./voice/twilioStream.js";
import { warmFillers } from "./voice/ttsBridge.js";
import { purgeExpiredTranscripts } from "./db/persistence.js";
import { startLearningScheduler } from "./learning/scheduler.js";
import { CallAgent } from "./brain/agent.js";
import { synthesizeWav } from "./tester/synth.js";
import { TESTER_HTML } from "./tester/page.js";

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
  dbConfigured,
}));

app.get("/", async () => ({ service: "mello-voice", status: "up" }));

// --- Outbound call trigger -------------------------------------------------
// POST /voice/call { "to": "+91XXXXXXXXXX" } — dials a number using the Twilio
// REST API. Twilio calls back /voice/incoming once the callee picks up, which
// opens the Media Stream and hands off to the brain exactly like an inbound call.
app.post("/voice/call", { preHandler: requireApiKey }, async (request, reply) => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    return reply.code(503).send({ error: "twilio_not_configured" });
  }

  const { to } = (request.body ?? {}) as { to?: string };
  if (!to) return reply.code(400).send({ error: "missing_to" });

  const baseUrl = env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? `http://localhost:${env.PORT}`;
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  const call = await client.calls.create({
    to,
    from: env.TWILIO_PHONE_NUMBER,
    url: `${baseUrl}/voice/incoming`,
    method: "POST",
  });

  request.log.info({ callSid: call.sid, to }, "Outbound call initiated");
  return { ok: true, callSid: call.sid, to };
});

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
    // Mello greets via Sarvam TTS over the media stream. Only fall back to a
    // <Say> if Sarvam isn't configured (otherwise the call would be silent).
    if (!sarvamConfigured) {
      twiml.say(
        { voice: "Polly.Aditi", language: "en-IN" },
        "Hello, this is Mello. The voice service is not configured yet.",
      );
    }
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

// --- Browser test console (ElevenLabs-style, no phone needed) ---------------
// GET /test serves a chat UI; the two POSTs run the real brain + return TTS WAV.
const testSessions = new Map<string, CallAgent>();

/**
 * Bearer API-key guard for /test/* routes (SEC-CRIT-01).
 * If MELLO_API_KEY is set, the Authorization header must match exactly.
 * If not set, the route is open but a boot warning is shown (dev only).
 */
function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void,
) {
  if (!apiKeyConfigured) return done(); // dev without key — open (warn at boot)
  const auth = (request.headers["authorization"] as string | undefined) ?? "";
  if (auth === `Bearer ${env.MELLO_API_KEY}`) return done();
  reply.code(401).send({ error: "unauthorized" });
}

app.get("/test", { preHandler: requireApiKey }, async (_req, reply) =>
  reply.header("Content-Type", "text/html").send(TESTER_HTML),
);

app.post("/test/start", { preHandler: requireApiKey }, async (request) => {
  const { sessionId, callerPhone, speaker, withAudio } = (request.body ?? {}) as {
    sessionId?: string;
    callerPhone?: string;
    speaker?: string;
    withAudio?: boolean;
  };
  if (!sessionId) return { error: "missing_sessionId" };
  const agent = new CallAgent(app.log, `TEST-${sessionId}`, callerPhone || "+910000000000");
  testSessions.set(sessionId, agent);
  const reply = await agent.startSession();
  // withAudio:false → return text immediately; the client fetches voice via
  // /test/speak in parallel so the reply shows without waiting on TTS.
  const audio = withAudio === false ? null : await synthesizeWav(reply, speaker);
  return { reply, audio };
});

app.post("/test/message", { preHandler: requireApiKey }, async (request) => {
  const { sessionId, text, speaker, withAudio } = (request.body ?? {}) as {
    sessionId?: string;
    text?: string;
    speaker?: string;
    withAudio?: boolean;
  };
  const agent = sessionId ? testSessions.get(sessionId) : undefined;
  if (!agent) return { error: "no_session" };
  const reply = await agent.handleUserTurn(text ?? "");
  const audio = withAudio === false ? null : await synthesizeWav(reply, speaker);
  return { reply, audio };
});

// Synthesize speech for already-returned text (lets the dashboard show the reply
// instantly, then play her voice a beat later instead of blocking on TTS).
app.post("/test/speak", { preHandler: requireApiKey }, async (request) => {
  const { text, speaker } = (request.body ?? {}) as { text?: string; speaker?: string };
  if (!text?.trim()) return { audio: null };
  const audio = await synthesizeWav(text, speaker);
  return { audio };
});

// --- Boot ------------------------------------------------------------------
try {
  await app.listen({ port: env.PORT, host: env.HOST });
  if (!apiKeyConfigured) {
    app.log.warn(
      "MELLO_API_KEY not set — /test/* routes are OPEN. Set it before exposing the server over ngrok or any public URL.",
    );
  }
  if (!twilioConfigured) {
    app.log.warn(
      "Twilio not configured yet (no SID/auth token). Server is up; fill in .env.local when KYC + auth clear.",
    );
  }
  if (!sarvamConfigured) {
    app.log.warn(
      "SARVAM_API_KEY missing — calls connect and audio streams in, but won't be transcribed. Add it to .env.local.",
    );
  } else {
    // Pre-generate filler audio so it plays instantly on the first call.
    void warmFillers(app.log);
  }
  if (!dbConfigured) {
    app.log.warn(
      "Supabase not configured — running on the in-memory config seed; calls/transcripts/bookings are NOT persisted. Add SUPABASE_URL + SUPABASE_SERVICE_KEY to .env.local.",
    );
  } else {
    // Privacy: purge transcripts past their 90-day TTL — now and daily.
    void purgeExpiredTranscripts(app.log);
    setInterval(() => void purgeExpiredTranscripts(app.log), 24 * 60 * 60 * 1000).unref();

    // Step 11: per-facility learning loop — analyze call history and refresh
    // the context injected into Mello's system prompt. Runs on boot + daily.
    const facilityId = (await import("./facility/facility.js")).loadFacilityConfig().facility.id;
    startLearningScheduler(app.log, facilityId);
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
