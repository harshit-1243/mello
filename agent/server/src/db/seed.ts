/**
 * Seed Supabase from the facility's config.json. Run once after applying
 * db/schema.sql:  `npm run db:seed`
 *
 * Idempotent (upserts). Seed bookings are written relative to "today" so the
 * demo scenarios (group conflict, external booking) stay valid — re-run to
 * refresh the dates.
 */
import { db } from "./client.js";
import { loadFacilityConfig } from "../facility/facility.js";
import { addDays, nowInTz } from "../util/datetime.js";

async function main(): Promise<void> {
  if (!db) {
    console.error("Supabase not configured. Set SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local.");
    process.exit(1);
  }
  const cfg = loadFacilityConfig();
  const fid = cfg.facility.id;
  const today = nowInTz().date;

  console.log(`Seeding facility "${fid}" ...`);

  await db.from("facilities").upsert({
    id: fid,
    name: cfg.facility.name,
    timezone: cfg.facility.timezone,
    open_time: cfg.facility.open_time,
    close_time: cfg.facility.close_time,
    config: cfg,
  });

  await db.from("members").upsert(
    cfg.members.map((m) => ({
      facility_id: fid,
      name: m.name,
      phone: m.phone,
      tier: m.tier,
      active: m.active,
      joined_at: (m as { joined_at?: string }).joined_at ?? null,
    })),
    { onConflict: "facility_id,phone" },
  );

  await db.from("groups").upsert(cfg.groups.map((g) => ({ id: g.id, facility_id: fid, label: g.label })));
  const gm = cfg.groups.flatMap((g) =>
    g.member_phones.map((p) => ({ group_id: g.id, facility_id: fid, member_phone: p })),
  );
  await db.from("group_members").upsert(gm);

  const bookings = cfg.demo_seed_bookings
    .filter((s) => !s._disabled)
    .map((s) => ({
      id: `SEED-${s.court_id}-${s.start_time}`,
      facility_id: fid,
      sport: s.sport,
      court_id: s.court_id,
      booking_date: addDays(today, s.date_offset_days),
      start_time: s.start_time,
      end_time: s.end_time,
      source: s.source,
      booked_by_phone: s.booked_by_phone ?? null,
      booked_by_name: s.booked_by_name ?? null,
    }));
  if (bookings.length) await db.from("bookings").upsert(bookings);

  console.log(
    `Done: ${cfg.members.length} members, ${cfg.groups.length} groups, ${bookings.length} seed bookings.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
