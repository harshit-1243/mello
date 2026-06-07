import type { WebSocket } from "ws";
import type { FastifyBaseLogger } from "fastify";
import { SttBridge } from "./sttBridge.js";
import { TtsBridge } from "./ttsBridge.js";
import { CallAgent } from "../brain/agent.js";
import { env } from "../env.js";

/** Twilio outbound media frame size: 20ms of 8kHz μ-law = 160 bytes. */
const OUT_FRAME_BYTES = 160;

/**
 * Twilio Media Streams protocol messages we care about.
 * Twilio also sends "connected" and "mark"; we ignore those here.
 */
interface TwilioStartMessage {
  event: "start";
  start: {
    streamSid: string;
    callSid: string;
    customParameters?: Record<string, string>;
  };
}
interface TwilioMediaMessage {
  event: "media";
  media: { payload: string }; // base64-encoded μ-law 8 kHz
}
interface TwilioStopMessage {
  event: "stop";
}
type TwilioMessage =
  | TwilioStartMessage
  | TwilioMediaMessage
  | TwilioStopMessage
  | { event: string };

/**
 * Handle one Twilio media-stream WebSocket connection (one phone call).
 * Spins up an STT bridge on `start`, forwards every `media` frame to it, and
 * tears it down on `stop` / close.
 */
export function handleTwilioStream(socket: WebSocket, log: FastifyBaseLogger): void {
  let bridge: SttBridge | null = null;
  let tts: TtsBridge | null = null;
  let agent: CallAgent | null = null;
  let callSid = "unknown";
  let streamSid = "";
  let frameCount = 0;
  // Process caller turns one at a time so LLM calls don't interleave.
  let turnChain: Promise<void> = Promise.resolve();

  /** Send μ-law audio back to the caller as Twilio outbound media frames. */
  const playToCaller = (base64MuLaw: string): void => {
    if (!streamSid) return;
    const buf = Buffer.from(base64MuLaw, "base64");
    for (let i = 0; i < buf.length; i += OUT_FRAME_BYTES) {
      const payload = buf.subarray(i, i + OUT_FRAME_BYTES).toString("base64");
      socket.send(JSON.stringify({ event: "media", streamSid, media: { payload } }));
    }
  };

  socket.on("message", async (raw: Buffer) => {
    let msg: TwilioMessage;
    try {
      msg = JSON.parse(raw.toString("utf8")) as TwilioMessage;
    } catch {
      return; // ignore non-JSON frames
    }

    switch (msg.event) {
      case "start": {
        const start = (msg as TwilioStartMessage).start;
        callSid = start?.callSid ?? "unknown";
        streamSid = start?.streamSid ?? "";
        const callerPhone = start?.customParameters?.callerPhone ?? "unknown";
        log.info({ callSid, streamSid, callerPhone }, "Media stream started");

        agent = new CallAgent(log, callSid, callerPhone);

        // Voice out: Sarvam TTS → μ-law → Twilio.
        tts = new TtsBridge(log, callSid, playToCaller);
        await tts.start();

        // Open the call record + speak the membership-aware greeting.
        const greeting = await agent.startSession();
        log.info({ callSid }, `🤖 Mello (greeting): ${greeting}`);
        void tts.say(greeting);

        // Voice in: each finalized transcript → brain → TTS, serialized.
        bridge = new SttBridge(log, callSid, (text) => {
          turnChain = turnChain.then(async () => {
            // Mask think-time with a quick (pre-cached) filler so there's no dead air.
            if (env.VOICE_FILLER) tts!.sayFiller();
            const reply = await agent!.handleUserTurn(text);
            if (reply) await tts!.say(reply);
          });
        });
        await bridge.start();
        break;
      }
      case "media": {
        frameCount++;
        bridge?.pushMuLawFrame((msg as TwilioMediaMessage).media.payload);
        break;
      }
      case "stop": {
        log.info({ callSid, frames: frameCount }, "Media stream stopped");
        await bridge?.stop();
        await tts?.stop();
        await agent?.endSession();
        bridge = null;
        tts = null;
        agent = null;
        break;
      }
      // "connected", "mark", and anything else: ignore.
    }
  });

  socket.on("close", async () => {
    await bridge?.stop();
    await tts?.stop();
    await agent?.endSession();
    log.info({ callSid, frames: frameCount }, "Twilio media WS closed");
  });

  socket.on("error", (err) => log.error({ callSid, err }, "Twilio media WS error"));
}
