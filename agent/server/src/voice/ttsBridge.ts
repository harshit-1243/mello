import { SarvamAIClient, type SarvamAI } from "sarvamai";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.js";

type TtsSocket = Awaited<ReturnType<SarvamAIClient["textToSpeechStreaming"]["connect"]>>;

/**
 * Bridges Mello's reply text to Sarvam streaming TTS and emits Twilio-ready
 * audio. We ask Sarvam for μ-law @ 8 kHz directly — the exact format Twilio
 * Media Streams play — so no conversion/resampling is needed on the way out.
 *
 * One bridge per call (created on stream start, closed on stop).
 */
export class TtsBridge {
  private socket: TtsSocket | null = null;
  private opening: Promise<void> | null = null;
  private closed = false;

  constructor(
    private readonly log: FastifyBaseLogger,
    private readonly callSid: string,
    /** Called with each base64 μ-law (8 kHz) audio chunk to play to the caller. */
    private readonly onAudio: (base64MuLaw: string) => void,
  ) {}

  /** Open the Sarvam TTS socket and configure the voice. No-op without a key. */
  async start(): Promise<void> {
    if (!env.SARVAM_API_KEY) {
      this.log.warn({ callSid: this.callSid }, "SARVAM_API_KEY missing — TTS offline, caller hears nothing.");
      return;
    }

    this.opening = (async () => {
      const client = new SarvamAIClient({ apiSubscriptionKey: env.SARVAM_API_KEY });
      const socket = await client.textToSpeechStreaming.connect({
        // Streaming TTS only supports bulbul:v2 (v3 is non-streaming only).
        model: "bulbul:v2",
        "Api-Subscription-Key": env.SARVAM_API_KEY!,
      });

      socket.on("message", (msg) => this.handleMessage(msg));
      socket.on("error", (err) => this.log.error({ callSid: this.callSid, err }, "Sarvam TTS error"));
      socket.on("close", () => this.log.info({ callSid: this.callSid }, "Sarvam TTS closed"));

      await socket.waitForOpen();
      // First message must be the config. μ-law @ 8kHz = Twilio's native format.
      socket.configureConnection({
        target_language_code: "hi-IN", // handles Hinglish well with preprocessing on
        speaker: env.SARVAM_TTS_SPEAKER as SarvamAI.ConfigureConnection.Data.Speaker,
        output_audio_codec: "mulaw",
        speech_sample_rate: 8000,
        enable_preprocessing: true,
      });
      this.log.info({ callSid: this.callSid }, "Sarvam TTS connected");
      this.socket = socket;
    })();

    try {
      await this.opening;
    } catch (err) {
      this.log.error({ callSid: this.callSid, err }, "Failed to open Sarvam TTS");
      this.socket = null;
    }
  }

  /** Synthesize and stream a line of speech. */
  async say(text: string): Promise<void> {
    const line = text.trim();
    if (!line) return;
    if (this.opening) await this.opening.catch(() => {});
    if (!this.socket) return;
    this.socket.convert(line);
    this.socket.flush();
  }

  async stop(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    if (this.opening) await this.opening.catch(() => {});
    if (!this.socket) return;
    try {
      this.socket.close();
    } catch (err) {
      this.log.warn({ callSid: this.callSid, err }, "Error closing Sarvam TTS");
    }
  }

  private handleMessage(msg: SarvamAI.AudioOutput | SarvamAI.EventResponse | SarvamAI.ErrorResponse): void {
    if (msg.type === "audio") {
      const audio = (msg as SarvamAI.AudioOutput).data?.audio;
      if (audio) this.onAudio(audio);
    } else if (msg.type === "error") {
      this.log.error({ callSid: this.callSid, msg }, "Sarvam TTS returned error");
    }
    // "events" (e.g. completion) — ignored for now.
  }
}
