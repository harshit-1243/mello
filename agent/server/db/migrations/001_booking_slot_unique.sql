-- Migration 001 — concurrency backstop against double-booking.
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- It prevents two bookings from ever holding the same court at the same date +
-- start time, even under truly-simultaneous calls. The app also pre-checks, but
-- this UNIQUE index is the airtight guarantee.
--
-- If this errors with "could not create unique index ... duplicate key value",
-- you already have duplicate bookings (e.g. from earlier testing). Find + remove
-- them first with the SELECT below, then re-run the CREATE.

create unique index if not exists bookings_slot_unique
  on bookings (facility_id, court_id, booking_date, start_time);

-- --- Helper: find duplicates if the index creation fails -------------------
-- select facility_id, court_id, booking_date, start_time, count(*), array_agg(id)
-- from bookings
-- group by facility_id, court_id, booking_date, start_time
-- having count(*) > 1;
