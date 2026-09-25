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

## Suggested fix

Store the booking's time range and let Postgres reject overlaps:

```sql
create extension if not exists btree_gist;
alter table bookings add column during tsrange generated always as
  (tsrange(booking_date + start_time::time, booking_date + end_time::time)) stored;
alter table bookings add constraint bookings_no_overlap
  exclude using gist (facility_id with =, court_id with =, during with &&)
  where (status = 'confirmed');
```

For full/half basketball, write one row per *physical half* (a full-court booking = two rows,
`half_a` + `half_b`, inserted together, e.g. via an RPC), so the same constraint covers it.
