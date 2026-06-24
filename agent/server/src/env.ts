import dotenv from "dotenv";

// Load .env.local first (developer secrets), then .env as a fallback. dotenv
// does not override already-set vars, so .env.local wins, and real process env
// (e.g. Railway dashboard vars) wins over both.
dotenv.config({ path: ".env.local" });
dotenv.config();

/**
 * Returns a trimmed env var, or undefined if missing/blank.
 * Keeping Twilio creds optional means the server boots fine BEFORE
 * KYC + auth are done — we just can't place/receive real calls yet.
 */
function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export const env = {
  PORT: Number(process.env.PORT ?? 8080),
  HOST: process.env.HOST ?? "0.0.0.0",
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // --- Twilio (pending: KYC + number purchase + auth token) ----------------
  // Paste these into .env.local once available. Until then they stay undefined
  // and the server logs a warning instead of crashing.
  TWILIO_ACCOUNT_SID: optional("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: optional("TWILIO_AUTH_TOKEN"),
  TWILIO_PHONE_NUMBER: optional("TWILIO_PHONE_NUMBER"),

  // Verify incoming webhooks really came from Twilio. Turn on only once you
  // have an auth token AND a public https URL (PUBLIC_BASE_URL).
  VALIDATE_TWILIO_SIGNATURE: optional("VALIDATE_TWILIO_SIGNATURE") === "true",
  PUBLIC_BASE_URL: optional("PUBLIC_BASE_URL"),

  // --- Sarvam AI (free tier) -----------------------------------------------
  // Speech-to-text, the LLM brain, and (later) TTS — one key for all three.
  // Get it at dashboard.sarvam.ai. Without it the server still accepts calls
  // and counts audio frames, but can't transcribe or run the brain.
  SARVAM_API_KEY: optional("SARVAM_API_KEY"),

  // Which Sarvam chat model the brain uses. 105B follows the persona + multi-hop
  // booking logic much better than 30B (measured), so it's the default despite
  // 30B being nominally cheaper. Override per-environment if needed.
  SARVAM_LLM_MODEL: optional("SARVAM_LLM_MODEL") ?? "sarvam-105b",

  // Reasoning effort for the brain. "medium" handles the multi-hop conflict
  // turns cleanly; "low" is faster but flubbed them in testing. Tunable.
  SARVAM_REASONING_EFFORT: (optional("SARVAM_REASONING_EFFORT") ?? "medium") as
    | "low"
    | "medium"
    | "high",

  // TTS voice + model. We use bulbul:v3 (better quality) via the non-streaming
  // endpoint on BOTH live calls and the test console. Good v3 voices: ritu,
  // priya (F); rohan, amit (M). See README for the full list.
  SARVAM_TTS_MODEL: (optional("SARVAM_TTS_MODEL") ?? "bulbul:v3") as "bulbul:v2" | "bulbul:v3",
  SARVAM_TTS_SPEAKER: optional("SARVAM_TTS_SPEAKER") ?? "ritu",

  // Speak a short filler ("Let me check…") the instant the caller finishes, to
  // mask the brain's think time so there's no dead air. Phone calls only.
  VOICE_FILLER: (optional("VOICE_FILLER") ?? "true") === "true",

  // Facility whose config.json + system-prompt.md to load. Defaults to the
  // demo facility, resolved relative to the package (agent/facilities/...).
  FACILITY_DIR: optional("FACILITY_DIR"),

  // --- Supabase (Step 7) ---------------------------------------------------
  // Project URL + SERVICE ROLE key (server-side writes; bypasses RLS). Get them
  // at Supabase dashboard → Project Settings → API. Without these the server
  // runs on the in-memory config seed (demo still works, nothing persisted).
  SUPABASE_URL: optional("SUPABASE_URL"),
  SUPABASE_SERVICE_KEY: optional("SUPABASE_SERVICE_KEY"),

  // --- WhatsApp confirmations (Step 9) -------------------------------------
  // Meta Cloud API: a permanent/system-user token + the phone-number id of the
  // sending number (Meta dashboard → WhatsApp → API setup). Sandbox creds are
  // fine for the demo. Without both, confirmations are LOGGED instead of sent,
  // so you can still see the exact message that would have gone out.
  WHATSAPP_TOKEN: optional("WHATSAPP_TOKEN"),
  WHATSAPP_PHONE_ID: optional("WHATSAPP_PHONE_ID"),
  // Graph API version for the WhatsApp endpoint. Bump if Meta deprecates it.
  WHATSAPP_API_VERSION: optional("WHATSAPP_API_VERSION") ?? "v21.0",

  // --- Razorpay payment links (Step 9) -------------------------------------
  // Test keys (rzp_test_...) are enough for the demo. Without them, a
  // placeholder link is returned + logged instead of hitting the API.
  RAZORPAY_KEY_ID: optional("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: optional("RAZORPAY_KEY_SECRET"),
  // Payment links expire after this many minutes (mirrors config.payment).
  RAZORPAY_LINK_VALIDITY_MINUTES: Number(optional("RAZORPAY_LINK_VALIDITY_MINUTES") ?? 60),

  // --- API auth (SEC-CRIT-01) -----------------------------------------------
  // Bearer token required on all /test/* routes when set. Generate any long
  // random string (e.g. `openssl rand -hex 32`) and paste here + ngrok header.
  // If unset, test routes are open — fine on localhost, DO NOT expose via ngrok.
  MELLO_API_KEY: optional("MELLO_API_KEY"),
} as const;

/** True once we have enough Twilio config to actually handle live calls. */
export const twilioConfigured =
  Boolean(env.TWILIO_ACCOUNT_SID) && Boolean(env.TWILIO_AUTH_TOKEN);

/** True once Sarvam STT can be used. */
export const sarvamConfigured = Boolean(env.SARVAM_API_KEY);

/** True once Supabase persistence is available. */
export const dbConfigured = Boolean(env.SUPABASE_URL) && Boolean(env.SUPABASE_SERVICE_KEY);

/** True once WhatsApp messages can actually be sent (else they're logged). */
export const whatsappConfigured = Boolean(env.WHATSAPP_TOKEN) && Boolean(env.WHATSAPP_PHONE_ID);

/** True once real Razorpay links can be created (else a placeholder is used). */
export const razorpayConfigured = Boolean(env.RAZORPAY_KEY_ID) && Boolean(env.RAZORPAY_KEY_SECRET);

/** True once the API key is set — /test/* routes will require Bearer auth. */
export const apiKeyConfigured = Boolean(env.MELLO_API_KEY);
