-- Mello — Outbound transcripts (per-call feed on the dashboard)
-- Run this once in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS).
--
-- Adds a transcript to each outbound call attempt so the dashboard's Outbound
-- section can show a per-call feed (name · time · outcome) with the full
-- Hindi/English conversation on click. The Python outbound agent writes it via
-- REST alongside the disposition; the dashboard reads it with the service key.
--
-- Shape: a JSON array of turns, newest call = newest row:
--   [{"ts": "2026-07-01T08:42:17", "role": "assistant"|"user", "text": "..."}]

alter table outbound_call_attempts
  add column if not exists transcript jsonb not null default '[]'::jsonb;
