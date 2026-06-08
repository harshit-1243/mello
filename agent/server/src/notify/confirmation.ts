import type { FastifyBaseLogger } from "fastify";
import { loadFacilityConfig } from "../facility/facility.js";
import { daysBetween, toMinutes } from "../util/datetime.js";
import { sendWhatsApp } from "./whatsapp.js";
import { createPaymentLink } from "./razorpay.js";

/**
 * Builds and sends the WhatsApp booking confirmation. THIS is the one place the
 * assigned court number is allowed to surface — it is never spoken on the call.
 * Members see no price; non-members see the amount + how to pay.
 *
 * Everything here is best-effort and never throws.
 */

export interface ConfirmationParams {
  sport: string; // sport id, e.g. "badminton"
  courtLabel: string; // e.g. "Court 2" — appears ONLY here
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM 24h
  endTime: string; // HH:MM 24h
  amountInr: number; // 0 for members
  isMember: boolean;
  phone: string;
  bookingId: string;
  today: string; // YYYY-MM-DD (facility tz) for "Today"/"Tomorrow" labels
}

/** "badminton" → "Badminton" using the facility config's display name. */
function sportName(sportId: string): string {
  const s = loadFacilityConfig().sports.find((x) => x.id === sportId);
  if (s) return s.name;
  return sportId.charAt(0).toUpperCase() + sportId.slice(1);
}

/** YYYY-MM-DD → "Today" / "Tomorrow" / "Mon, 12 Jun". */
function dateLabel(today: string, date: string): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  const d = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** "20:00" → "8 PM", "20:30" → "8:30 PM". */
function clock12(hhmm: string): string {
  const mins = toMinutes(hhmm);
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 && h < 24 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h} ${ampm}` : `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** "20:00"–"21:00" → "8–9 PM" (collapses the meridiem when it matches). */
function timeRange(start: string, end: string): string {
  const s = clock12(start);
  const e = clock12(end);
  const sAm = s.endsWith("AM");
  const eAm = e.endsWith("AM");
  if (sAm === eAm) {
    return `${s.replace(/ (AM|PM)$/, "")}–${e}`;
  }
  return `${s}–${e}`;
}

/** Build the confirmation text. Exposed for unit-style checks. */
export function buildConfirmationText(p: ConfirmationParams): string {
  const facility = loadFacilityConfig().facility.name;
  const when = `${dateLabel(p.today, p.date)} ${timeRange(p.startTime, p.endTime)}`;
  const lines = [
    `✅ Confirmed — ${facility}`,
    `${sportName(p.sport)} · ${p.courtLabel} · ${when}`,
  ];
  if (!p.isMember) {
    lines.push(`Amount ₹${p.amountInr} (pay at venue, or reply for a payment link)`);
  }
  lines.push(`Ref: ${p.bookingId}`);
  return lines.join("\n");
}

/** Fire the booking confirmation over WhatsApp (server-side, fire-and-forget). */
export async function sendBookingConfirmation(
  log: FastifyBaseLogger,
  p: ConfirmationParams,
): Promise<void> {
  try {
    await sendWhatsApp(log, p.phone, buildConfirmationText(p));
  } catch (err) {
    log.warn({ bookingId: p.bookingId, err }, "sendBookingConfirmation failed");
  }
}

/**
 * Create a Razorpay payment link and deliver it over WhatsApp. Used by the
 * `send_payment_link` tool when a non-member chooses to pay now.
 */
export async function sendPaymentLink(
  log: FastifyBaseLogger,
  args: { phone: string; amountInr: number; bookingId: string },
): Promise<boolean> {
  try {
    const facility = loadFacilityConfig().facility.name;
    const { link } = await createPaymentLink(log, {
      amountInr: args.amountInr,
      bookingId: args.bookingId,
      phone: args.phone,
      description: `${facility} booking ${args.bookingId}`,
    });
    const text = [
      `💳 ${facility} — payment link`,
      `Amount ₹${args.amountInr}`,
      link,
      `Ref: ${args.bookingId}`,
    ].join("\n");
    return await sendWhatsApp(log, args.phone, text);
  } catch (err) {
    log.warn({ bookingId: args.bookingId, err }, "sendPaymentLink failed");
    return false;
  }
}
