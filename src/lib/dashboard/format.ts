/** Small display helpers for the dashboard. */

/** "+919876512345" → "+91 98765 12345" (Indian grouping; falls back gracefully). */
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+91(\d{5})(\d{5})$/);
  if (m) return `+91 ${m[1]} ${m[2]}`;
  return e164;
}

/** ISO timestamp → "just now" / "3 min ago" / "1 hr ago". */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs === 1 ? "1 hr ago" : `${hrs} hr ago`;
}

/** Seconds → "0:42" / "12:05". */
export function clockFromSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** ₹ with Indian grouping, no decimals. */
export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
