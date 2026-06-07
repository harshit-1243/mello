import { SarvamAIClient } from "sarvamai";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.js";
import { muLawToPcm16 } from "../audio/mulaw.js";

// Derive the socket type from the SDK rather than deep-importing an internal
// path (the package doesn't export its internals as subpaths).
type SttSocket = Awaited<ReturnType<SarvamAIClient["speechToTextStreaming"]["connect"]>>;

/**
 * Bridges one phone call's audio to Sarvam streaming STT.
 *
 * Twilio gives us μ-law 8 kHz frames; Sarvam wants linear PCM. We convert each
 * frame and forward it, then log transcripts as they come back. One bridge per
 * call — created when the Twilio media stream starts, closed when it stops.
 *
 * We deliberately auto-detect the language ("unknown") so Hindi↔English
 * code-switching is preserved — that's the whole point of using Sarvam over a
 * generic STT. We keep `model` at the server default for now; pin saaras:v3
 * once verified against the live API + real audio.
 */
export class SttBridge {
  private socket: SttSocket | null = null;
  private opening: Promise<void> | null = null;
  private closed = false;

  constructor(
    private readonly log: FastifyBaseLogger,
    private readonly callSid: string,
  ) {}

  /** Open the Sarvam STT socket. No-op (with a warning) if no API key. */
  async start(): Promise<void> {
    if (!env.SARVAM_API_KEY) {
      this.log.warn(
        { callSid: this.callSid },
        "SARVAM_API_KEY missing — audio will be received but not transcribed. Add it to .env.local.",
      );
      return;
    }

    this.opening = (async () => {
      const client = new SarvamAIClient({ apiSubscriptionKey: env.SARVAM_API_KEY });
      const socket = await client.speechToTextStreaming.connect({
        "language-code": "unknown", // auto-detect → preserves Hindi/English code-switching
        input_audio_codec: "pcm_s16le",
        sample_rate: "8000",
        vad_signals: "true", // emit START_SPEECH / END_SPEECH events
        "Api-Subscription-Key": env.SARVAM_API_KEY!,
      });

      socket.on("open", () => this.log.info({ callSid: this.callSid }, "Sarvam STT connected"));
      socket.on("error", (err) =>
        this.log.error({ callSid: this.callSid, err }, "Sarvam STT error"),
      );
      socket.on("close", () => this.log.info({ callSid: this.callSid }, "Sarvam STT closed"));
      socket.on("message", (msg) => this.handleMessage(msg));

      this.socket = socket;
    })();

    try {
      await this.opening;
    } catch (err) {
      this.log.error({ callSid: this.callSid, err }, "Failed to open Sarvam STT");
      this.socket = null;
    }
  }

  /** Forward one base64 μ-law frame from Twilio to Sarvam (as PCM). */
  pushMuLawFrame(base64MuLaw: string): void {
    if (!this.socket) return;
    const pcm = muLawToPcm16(Buffer.from(base64MuLaw, "base64"));
    this.socket.transcribe({ audio: pcm.toString("base64"), sample_rate: 8000 });
  }

  /** Flush any buffered audio and close the socket. */
  async stop(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    if (this.opening) await this.opening.catch(() => {});
    if (!this.socket) return;
    try {
      this.socket.flush();
      this.socket.close();
    } catch (err) {
      this.log.warn({ callSid: this.callSid, err }, "Error closing Sarvam STT");
    }
  }

  private handleMessage(msg: { type: string; data: unknown }): void {
    if (msg.type === "data") {
      const data = msg.data as { transcript?: string; language_code?: string };
      const transcript = data.transcript?.trim();
      if (transcript) {
        this.log.info(
          { callSid: this.callSid, language: data.language_code },
          `📝 Transcript: ${transcript}`,
        );
      }
    } else if (msg.type === "events") {
      const data = msg.data as { signal_type?: string };
      if (data.signal_type) {
        this.log.debug({ callSid: this.callSid }, `VAD: ${data.signal_type}`);
      }
    } else if (msg.type === "error") {
      this.log.error({ callSid: this.callSid, data: msg.data }, "Sarvam STT returned error");
    }
  }
}
