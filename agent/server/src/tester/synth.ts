import { SarvamAIClient, type SarvamAI } from "sarvamai";
import { env } from "../env.js";

/**
 * One-shot TTS for the browser test console. Returns base64 WAV (browser-
 * playable) — unlike the call path which streams μ-law for Twilio. Lets the
 * tester audition any voice without touching the live-call config.
 */
export async function synthesizeWav(text: string, speaker?: string): Promise<string | null> {
  if (!env.SARVAM_API_KEY || !text.trim()) return null;
  const client = new SarvamAIClient({ apiSubscriptionKey: env.SARVAM_API_KEY });
  const res = await client.textToSpeech.convert({
    text,
    target_language_code: "hi-IN",
    model: env.SARVAM_TTS_MODEL,
    speaker: (speaker ?? env.SARVAM_TTS_SPEAKER) as SarvamAI.TextToSpeechSpeaker,
  });
  return res.audios?.[0] ?? null;
}
