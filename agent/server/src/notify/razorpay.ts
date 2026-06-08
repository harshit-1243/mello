import type { FastifyBaseLogger } from "fastify";
import { env, razorpayConfigured } from "../env.js";
import { normalizePhone } from "../booking/engine.js";

/**
 * Create a Razorpay Payment Link for a non-member booking.
 *
 * Graceful by design: without API keys we return a clearly-labelled placeholder
 * URL and log it, so the booking + WhatsApp flow still works in the demo. With
 * keys, we hit the real Payment Links API and return the short URL.
 *
 * Amount is rupees in; Razorpay wants paise, so we ×100.
 * Never throws — a payment-link failure must not break a live call.
 */
export async function createPaymentLink(
  log: FastifyBaseLogger,
  args: { amountInr: number; bookingId: string; phone: string; description?: string },
): Promise<{ link: string; real: boolean }> {
  const contact = normalizePhone(args.phone);

  if (!razorpayConfigured) {
    const link = `https://rzp.io/i/demo-${args.bookingId}`;
    log.info({ bookingId: args.bookingId, amountInr: args.amountInr, link }, "💳 Razorpay (not configured — placeholder link)");
    return { link, real: false };
  }

  const validityMin = env.RAZORPAY_LINK_VALIDITY_MINUTES;
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  try {
    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(args.amountInr * 100), // paise
        currency: "INR",
        accept_partial: false,
        description: args.description ?? `Booking ${args.bookingId}`,
        reference_id: args.bookingId,
        customer: { contact },
        notify: { sms: false, email: false }, // we deliver the link over WhatsApp ourselves
        reminder_enable: false,
        expire_by: Math.floor(Date.now() / 1000) + validityMin * 60,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      log.warn({ bookingId: args.bookingId, status: res.status, detail }, "Razorpay link create failed");
      return { link: `https://rzp.io/i/demo-${args.bookingId}`, real: false };
    }
    const body = (await res.json()) as { short_url?: string };
    const link = body.short_url ?? `https://rzp.io/i/demo-${args.bookingId}`;
    log.info({ bookingId: args.bookingId, amountInr: args.amountInr, link }, "💳 Razorpay link created");
    return { link, real: true };
  } catch (err) {
    log.warn({ bookingId: args.bookingId, err }, "Razorpay link create threw");
    return { link: `https://rzp.io/i/demo-${args.bookingId}`, real: false };
  }
}
