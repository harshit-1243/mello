import { SarvamAIClient, type SarvamAI } from "sarvamai";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.js";

/**
 * Bridges Mello's reply text to Sarvam TTS and emits Twilio-ready audio.
 *
 * We use the NON-streaming TTS endpoint with `bulbul:v3` so live calls use the
 * same high-quality voice (ritu) as the test console — the streaming endpoint
 * only supports the older v2 voices. We request μ-law @ 8kHz directly (Twilio's
 * native format), so the returned audio streams straight back with no
 * conversion. Tradeoff vs streaming: ~1.5s to generate a reply instead of
 * ~0.3s, which the pre-cached filler ("Let me check…") masks.
 */

const FILLERS = ["Let me check…", "Ek second…", "Haan, dekhta hoon…", "Sure, one sec…"];
/** phrase → base64 μ-law, generated once so fillers play instantly. */
const fillerCache = new Map<string, string>();

function makeClient(): SarvamAIClient {
  return new SarvamAIClient({ apiSubscriptionKey: env.SARVAM_API_KEY! });
}

async function synthMuLaw(client: SarvamAIClient, text: string): Promise<string | null> {
  const res = await client.textToSpeech.convert({
    text,
    target_language_code: "en-IN",
    model: env.SARVAM_TTS_MODEL,
    speaker: env.SARVAM_TTS_SPEAKER as SarvamAI.TextToSpeechSpeaker,
    output_audio_codec: "mulaw",
    speech_sample_rate: 8000,
  });
  return res.audios?.[0] ?? null;
}

/** Pre-generate filler audio at boot so it can play with zero latency. */
export async function warmFillers(log: FastifyBaseLogger): Promise<void> {
  if (!env.SARVAM_API_KEY) return;
  const client = makeClient();
  await Promise.all(
    FILLERS.map(async (p) => {
      try {
        const audio = await synthMuLaw(client, p);
        if (audio) fillerCache.set(p, audio);
      } catch (err) {
        log.warn({ err }, "Failed to warm a TTS filler");
      }
    }),
  );
  log.info({ count: fillerCache.size }, "TTS fillers warmed");
}

export class TtsBridge {
  private readonly client: SarvamAIClient | null;

  constructor(
    private readonly log: FastifyBaseLogger,
    private readonly callSid: string,
    /** Called with base64 μ-law (8kHz) audio to play to the caller. */
    private readonly onAudio: (base64MuLaw: string) => void,
  ) {
    this.client = env.SARVAM_API_KEY ? makeClient() : null;
  }

  async start(): Promise<void> {
    if (!this.client) {
      this.log.warn({ callSid: this.callSid }, "SARVAM_API_KEY missing — TTS offline, caller hears nothing.");
    }
  }

  /** Synthesize a line and stream it to the caller. */
  async say(text: string): Promise<void> {
    const line = text.trim();
    if (!line || !this.client) return;
    try {
      const audio = await synthMuLaw(this.client, line);
      if (audio) this.onAudio(audio);
    } catch (err) {
      this.log.error({ callSid: this.callSid, err }, "TTS synth failed");
    }
  }

  /** Play a short filler instantly (from cache) to mask reply latency. */
  sayFiller(): void {
    if (!this.client || fillerCache.size === 0) return;
    const phrases = [...fillerCache.values()];
    const audio = phrases[Math.floor(Math.random() * phrases.length)]!;
    this.onAudio(audio);
  }

  async stop(): Promise<void> {
    // Non-streaming: nothing to tear down.
  }
}
