import type { FacilityConfig, Sport } from "../facility/facility.js";
import { addDays, daysBetween, overlaps, toHHMM, toMinutes } from "../util/datetime.js";

/** A booking held in memory. Times are minutes-from-midnight; date is YYYY-MM-DD. */
interface Booking {
  id: string;
  sport: string;
  court_id: string;
  date: string;
  start: number;
  end: number;
  source: string; // "mello" | "hudle" | "khelomore" | ...
  phone?: string;
  name?: string;
  mode?: "full" | "half";
}

/** Context about the current caller, supplied by the agent (not the LLM). */
export interface CallerContext {
  callerPhone: string;
  isMember: boolean;
  name?: string;
  today: string; // YYYY-MM-DD in facility tz
  nowMinutes: number; // minutes since midnight, today
}

export interface AvailabilityResult {
  available: boolean;
  alternative_times: string[];
}

/**
 * In-memory booking + rules engine for one call (seeded from config). This is
 * the source of truth for Step 5; Step 7 swaps the store for Supabase but keeps
 * the same rule logic.
 */
export class BookingEngine {
  private bookings: Booking[] = [];
  private seq = 0;

  constructor(
    private readonly config: FacilityConfig,
    private readonly today: string,
  ) {
    this.seed();
  }

  // --- Members -------------------------------------------------------------

  verifyMember(phone: string): { is_member: boolean; name?: string; tier?: string } {
    const m = this.config.members.find((x) => x.phone === normalizePhone(phone) && x.active);
    return m ? { is_member: true, name: m.name, tier: m.tier } : { is_member: false };
  }

  // --- Availability --------------------------------------------------------

  checkAvailability(
    args: {
      sport: string;
      date: string;
      start_time: string;
      duration_minutes?: number;
      basketball_mode?: "full" | "half";
    },
    ctx: CallerContext,
  ): AvailabilityResult {
    const sport = this.findSport(args.sport);
    if (!sport) return { available: false, alternative_times: [] };

    const dur = args.duration_minutes ?? this.config.slot_rules.default_duration_minutes;
    const start = toMinutes(args.start_time);

    const isOpen = this.withinOpenHours(start, dur);
    const locked = this.isMemberLocked(args.date, start, ctx);
    const free = isOpen && !locked && this.freeCourts(sport, args.date, start, dur, args.basketball_mode);

    if (free && (free as string[]).length > 0) {
      return { available: true, alternative_times: [] };
    }
    return {
      available: false,
      alternative_times: this.suggestAlternatives(sport, args.date, start, dur, ctx, args.basketball_mode),
    };
  }

  // --- Group conflict ------------------------------------------------------

  checkGroup(args: { phone: string; sport: string; date: string; start_time: string }): {
    conflict: boolean;
  } {
    const phone = normalizePhone(args.phone);
    const start = toMinutes(args.start_time);
    const window = this.config.group_restriction_rule.block_window_hours_before_start * 60;

    // Phones of everyone sharing a group with the caller (excluding caller).
    const groupmates = new Set<string>();
    for (const g of this.config.groups) {
      if (g.member_phones.includes(phone)) {
        for (const p of g.member_phones) if (p !== phone) groupmates.add(p);
      }
    }
    if (groupmates.size === 0) return { conflict: false };

    const conflict = this.bookings.some(
      (b) =>
        b.sport === args.sport &&
        b.date === args.date &&
        b.phone !== undefined &&
        groupmates.has(b.phone) &&
        Math.abs(b.start - start) <= window,
    );
    return { conflict };
  }

  // --- Create booking ------------------------------------------------------

  createBooking(
    args: {
      name: string;
      phone: string;
      sport: string;
      date: string;
      start_time: string;
      duration_minutes?: number;
      basketball_mode?: "full" | "half";
    },
    _ctx: CallerContext,
  ): { booking_id: string; assigned_court: string; status: string } {
    const sport = this.findSport(args.sport);
    if (!sport) return { booking_id: "", assigned_court: "", status: "error_unknown_sport" };

    const dur = args.duration_minutes ?? this.config.slot_rules.default_duration_minutes;
    const start = toMinutes(args.start_time);
    const free = this.freeCourts(sport, args.date, start, dur, args.basketball_mode);
    if (free.length === 0) return { booking_id: "", assigned_court: "", status: "unavailable" };

    const courtId = free[0]!;
    const court = sport.courts.find((c) => c.id === courtId)!;
    const id = `MLO-${String(++this.seq).padStart(4, "0")}`;
    this.bookings.push({
      id,
      sport: sport.id,
      court_id: courtId,
      date: args.date,
      start,
      end: start + dur,
      source: "mello",
      phone: normalizePhone(args.phone),
      name: args.name,
      mode: args.basketball_mode,
    });
    return { booking_id: id, assigned_court: court.label, status: "confirmed" };
  }

  // --- Internals -----------------------------------------------------------

  private findSport(id: string): Sport | undefined {
    const key = id.toLowerCase().trim();
    return this.config.sports.find((s) => s.id === key || s.name.toLowerCase() === key);
  }

  private withinOpenHours(start: number, dur: number): boolean {
    const open = toMinutes(this.config.facility.open_time);
    const close = toMinutes(this.config.facility.close_time); // "24:00" → 1440
    return start >= open && start + dur <= close;
  }

  /** Returns the IDs of courts free for this sport/slot (respecting basketball split rules). */
  private freeCourts(
    sport: Sport,
    date: string,
    start: number,
    dur: number,
    mode?: "full" | "half",
  ): string[] {
    const end = start + dur;
    const taken = (courtId: string) =>
      this.bookings.some(
        (b) => b.court_id === courtId && b.date === date && overlaps(start, end, b.start, b.end),
      );

    if (sport.id === "basketball") {
      const full = sport.courts.find((c) => c.mode === "full")!;
      const halves = sport.courts.filter((c) => c.mode === "half");
      if (mode === "half") {
        // A half is free if it's not taken AND the full court isn't booked.
        if (taken(full.id)) return [];
        return halves.filter((h) => !taken(h.id)).map((h) => h.id);
      }
      // Default / "full": full court needs itself AND both halves clear.
      const blocked = taken(full.id) || halves.some((h) => taken(h.id));
      return blocked ? [] : [full.id];
    }

    return sport.courts.filter((c) => !taken(c.id)).map((c) => c.id);
  }

  /**
   * Member-only window lock: a non-member asking for a slot inside a member
   * window that starts >30 min from now is locked out. Within 30 min it has
   * released to the public (court availability still applies separately).
   */
  private isMemberLocked(date: string, start: number, ctx: CallerContext): boolean {
    if (ctx.isMember) return false;

    const inWindow = this.config.member_only_windows.some((w) => {
      const ws = toMinutes(w.start);
      const we = toMinutes(w.end);
      return start >= ws && start < we;
    });
    if (!inWindow) return false;

    const releaseMin = this.config.member_window_release_policy.release_minutes_before_slot_start;
    const dayOffset = daysBetween(ctx.today, date);
    const minutesUntilStart = dayOffset * 1440 + start - ctx.nowMinutes;
    return minutesUntilStart > releaseMin; // still locked until T-30
  }

  /** Up to 2 alternative start times (same sport, same day) that are bookable. */
  private suggestAlternatives(
    sport: Sport,
    date: string,
    start: number,
    dur: number,
    ctx: CallerContext,
    mode?: "full" | "half",
  ): string[] {
    const out: string[] = [];
    for (const offset of [60, 120, 180, -60, 240]) {
      const alt = start + offset;
      if (!this.withinOpenHours(alt, dur)) continue;
      if (this.isMemberLocked(date, alt, ctx)) continue;
      if (this.freeCourts(sport, date, alt, dur, mode).length > 0) {
        out.push(toHHMM(alt));
        if (out.length === 2) break;
      }
    }
    return out;
  }

  private seed(): void {
    for (const s of this.config.demo_seed_bookings) {
      if (s._disabled) continue;
      this.bookings.push({
        id: `SEED-${s.court_id}-${s.start_time}`,
        sport: s.sport,
        court_id: s.court_id,
        date: addDays(this.today, s.date_offset_days),
        start: toMinutes(s.start_time),
        end: toMinutes(s.end_time),
        source: s.source,
        phone: s.booked_by_phone ? normalizePhone(s.booked_by_phone) : undefined,
        name: s.booked_by_name,
      });
    }
  }
}

/** Normalize a phone to "+<digits>" so caller-ID and config compare cleanly. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `+${digits}`;
}
