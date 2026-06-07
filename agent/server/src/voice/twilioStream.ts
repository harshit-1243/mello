import type { WebSocket } from "ws";
import type { FastifyBaseLogger } from "fastify";
import { SttBridge } from "./sttBridge.js";

/**
 * Twilio Media Streams protocol messages we care about.
 * Twilio also sends "connected" and "mark"; we ignore those here.
 */
interface TwilioStartMessage {
  event: "start";
  start: { streamSid: string; callSid: string };
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
  let callSid = "unknown";
  let frameCount = 0;

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
        log.info({ callSid, streamSid: start?.streamSid }, "Media stream started");
        bridge = new SttBridge(log, callSid);
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
