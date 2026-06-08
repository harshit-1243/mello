import type { FastifyBaseLogger } from "fastify";
import { env, whatsappConfigured } from "../env.js";
import { normalizePhone } from "../booking/engine.js";

/**
 * Send a plain-text WhatsApp message via the Meta Cloud API.
 *
 * Graceful by design (same pattern as the rest of the agent): if the token /
 * phone-number-id aren't set, we LOG the exact message that *would* have been
 * sent and return `false`. This lets the whole confirmation path run end-to-end
 * in the demo without Meta approval — you just read the message in the logs.
 *
 * Never throws: a messaging failure must never break a live call.
 */
export async function sendWhatsApp(
  log: FastifyBaseLogger,
  toPhone: string,
  message: string,
): Promise<boolean> {
  // Meta wants the number WITHOUT the leading "+", just country code + digits.
  const to = normalizePhone(toPhone).replace(/^\+/, "");

  if (!whatsappConfigured) {
    log.info({ to, message }, "📱 WhatsApp (not configured — message logged, not sent)");
    return false;
  }

  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_ID}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: message },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      log.warn({ to, status: res.status, detail }, "WhatsApp send failed");
      return false;
    }
    log.info({ to }, "📱 WhatsApp sent");
    return true;
  } catch (err) {
    log.warn({ to, err }, "WhatsApp send threw");
    return false;
  }
}
