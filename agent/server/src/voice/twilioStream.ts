import type { WebSocket } from "ws";
import type { FastifyBaseLogger } from "fastify";
import { SttBridge } from "./sttBridge.js";
import { CallAgent } from "../brain/agent.js";

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
  let agent: CallAgent | null = null;
  let callSid = "unknown";
  let frameCount = 0;
  // Process caller turns one at a time so LLM calls don't interleave.
  let turnChain: Promise<void> = Promise.resolve();

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
        const callerPhone = start?.customParameters?.callerPhone ?? "unknown";
        log.info({ callSid, streamSid: start?.streamSid, callerPhone }, "Media stream started");

        agent = new CallAgent(log, callSid, callerPhone);
        log.info({ callSid }, `🤖 Mello (greeting): ${agent.greeting()}`);

        // Feed each finalized transcript into the brain, serialized.
        bridge = new SttBridge(log, callSid, (text) => {
          turnChain = turnChain.then(async () => {
            const reply = await agent!.handleUserTurn(text);
            // Step 6: send `reply` to Sarvam TTS and stream it back to Twilio.
            void reply;
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
        bridge = null;
        break;
      }
      // "connected", "mark", and anything else: ignore.
    }
  });

  socket.on("close", async () => {
    await bridge?.stop();
    log.info({ callSid, frames: frameCount }, "Twilio media WS closed");
  });

  socket.on("error", (err) => log.error({ callSid, err }, "Twilio media WS error"));
}
