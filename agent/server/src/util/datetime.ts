/**
 * Small date/time helpers. All facility logic works in the facility's timezone
 * (Asia/Kolkata) and represents times as "HH:MM" 24h and dates as "YYYY-MM-DD".
 */

const TZ = "Asia/Kolkata";

export interface NowInTz {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  weekday: string; // e.g. "Monday"
  minutes: number; // minutes since midnight
}

/** Current date/time in the facility timezone. */
export function nowInTz(now: Date = new Date()): NowInTz {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" }).format(now);
  return { date, time, weekday, minutes: toMinutes(time) };
}

/** "HH:MM" → minutes since midnight. Tolerates "8:00", "08:00", "24:00". */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/** minutes since midnight → "HH:MM". */
export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Add N days to a "YYYY-MM-DD" date string. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"). Negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Two [start,end) minute ranges overlap? */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
