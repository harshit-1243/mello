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

  // Which Sarvam chat model the brain uses. 105B = best (128K ctx); 30B is
  // cheaper/faster. Override per-environment if needed.
  SARVAM_LLM_MODEL: optional("SARVAM_LLM_MODEL") ?? "sarvam-105b",

  // Facility whose config.json + system-prompt.md to load. Defaults to the
  // demo facility, resolved relative to the package (agent/facilities/...).
  FACILITY_DIR: optional("FACILITY_DIR"),
} as const;

/** True once we have enough Twilio config to actually handle live calls. */
export const twilioConfigured =
  Boolean(env.TWILIO_ACCOUNT_SID) && Boolean(env.TWILIO_AUTH_TOKEN);

/** True once Sarvam STT can be used. */
export const sarvamConfigured = Boolean(env.SARVAM_API_KEY);
