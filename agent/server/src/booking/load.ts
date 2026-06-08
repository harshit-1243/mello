import type { FastifyBaseLogger } from "fastify";
import { db } from "../db/client.js";
import { addDays, toMinutes } from "../util/datetime.js";
import { normalizePhone, type Booking, type EngineData } from "./engine.js";

/**
 * Load the engine's dynamic data (members, groups, bookings) from Supabase in
 * one batched read at call start. Returns null if there's no DB or the read
 * fails — the engine then falls back to the config.json seed.
 *
 * Only bookings within [today, today+horizon] are loaded (we never book in the
 * past and the advance window is 14 days), keeping the payload small.
 */
export async function loadEngineData(
  log: FastifyBaseLogger,
  facilityId: string,
  today: string,
  horizonDays = 14,
): Promise<EngineData | null> {
  if (!db) return null;
  try {
    const [members, groups, groupMembers, bookings] = await Promise.all([
      db.from("members").select("name,phone,tier,active").eq("facility_id", facilityId).eq("active", true),
      db.from("groups").select("id,label").eq("facility_id", facilityId),
      db.from("group_members").select("group_id,member_phone").eq("facility_id", facilityId),
      db
        .from("bookings")
        .select("id,sport,court_id,booking_date,start_time,end_time,source,booked_by_phone,booked_by_name,basketball_mode")
        .eq("facility_id", facilityId)
        .gte("booking_date", today)
        .lte("booking_date", addDays(today, horizonDays)),
    ]);

    for (const r of [members, groups, groupMembers, bookings]) {
      if (r.error) throw r.error;
    }

    return {
      members: (members.data ?? []).map((m) => ({
        name: m.name,
        phone: normalizePhone(m.phone),
        tier: m.tier,
        active: m.active,
      })),
      groups: (groups.data ?? []).map((g) => ({
        id: g.id,
        label: g.label,
        member_phones: (groupMembers.data ?? [])
          .filter((gm) => gm.group_id === g.id)
          .map((gm) => normalizePhone(gm.member_phone)),
      })),
      bookings: (bookings.data ?? []).map(
        (b): Booking => ({
          id: b.id,
          sport: b.sport,
          court_id: b.court_id,
          date: b.booking_date,
          start: toMinutes(b.start_time),
          end: toMinutes(b.end_time),
          source: b.source,
          phone: b.booked_by_phone ? normalizePhone(b.booked_by_phone) : undefined,
          name: b.booked_by_name ?? undefined,
          mode: (b.basketball_mode as "full" | "half" | null) ?? undefined,
        }),
      ),
    };
  } catch (err) {
    log.warn({ err }, "loadEngineData failed — falling back to config seed");
    return null;
  }
}
