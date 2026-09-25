# Inbound double-booking race results

`race_test.py` replays `saveBooking()` (`src/db/persistence.ts`) 1:1: an autocommit pre-check
SELECT, then INSERT, with 23505 mapped to "conflict". N threads are released by one barrier
against Postgres 16 loaded with `db/schema.sql`. Run 2026-09-25.

| Scenario | N | Result |
|---|---:|---|
| Same court + date + start time | 100 × 5 trials | 1 saved, 99 conflict every trial ✅ |
| Same court, overlapping times (19:00–20:00 vs 19:30–20:30) | 2 | **2 saved: court double-booked** ❌ |
| Basketball full court vs half A, same time | 2 | **2 saved: floor double-booked** ❌ |

## Why

- The only DB guard is `bookings_slot_unique ON (facility_id, court_id, booking_date, start_time)`,
  so the DB only rejects an *identical* start time on an *identical* `court_id`.
- Overlap and full/half-court checks happen only in the in-memory `BookingEngine`. Its bookings come
  from `loadEngineData()` **once at call start**, so a call can't see bookings made by other calls
  after it connected. The race window is the whole call (minutes), not milliseconds.
- `saveBooking` returning `"error"` (transient DB failure) still confirms the booking on the call
  and sends WhatsApp, with no row saved.

## Suggested fix (verified against the same harness)

Let Postgres reject *overlapping* ranges on a court, not just identical start times:

```sql
create extension if not exists btree_gist;
-- start_time/end_time are text, and text::time isn't immutable, so wrap it (HH:MM parses deterministically)
create or replace function booking_range(d date, s text, e text) returns tsrange
  language sql immutable as $$ select tsrange(d + s::time, d + e::time) $$;
alter table bookings add constraint bookings_no_overlap
  exclude using gist (facility_id with =, court_id with =,
                      booking_range(booking_date, start_time, end_time) with &&)
  where (status = 'confirmed');
```

With this in place, the harness goes to: identical slot 1/100 ✅, overlapping times 1/2 ✅,
full-vs-half basketball still 2/2 ❌. Two follow-ups:

- `saveBooking` must also treat **`23P01`** (exclusion_violation) as `"conflict"`, alongside `23505`.
- Full/half basketball: write one row per *physical half* (a full-court booking = `half_a` +
  `half_b` rows inserted in one transaction, e.g. via a Supabase RPC) so the same constraint covers
  it.
