-- Step 11: per-facility learning memory
-- Stores the auto-generated context that gets injected into Mello's system
-- prompt at the start of every call. Refreshed daily by the learning loop.

CREATE TABLE IF NOT EXISTS facility_memory (
  facility_id       TEXT PRIMARY KEY,
  generated_at      TIMESTAMPTZ DEFAULT now(),
  call_count        INTEGER DEFAULT 0,
  booking_count     INTEGER DEFAULT 0,
  conversion_rate   NUMERIC(5,2) DEFAULT 0,
  peak_sport        TEXT,
  peak_hour_range   TEXT,
  hot_miss_slots    JSONB DEFAULT '[]',
  hindi_pct         NUMERIC(5,2) DEFAULT 0,
  context_injection TEXT DEFAULT ''
);

ALTER TABLE facility_memory ENABLE ROW LEVEL SECURITY;

-- Service role (agent server) can read + write.
CREATE POLICY "service_all" ON facility_memory
  FOR ALL TO service_role USING (true);

-- Authenticated owners can read their own facility's memory (dashboard Step 10).
CREATE POLICY "owner_read" ON facility_memory
  FOR SELECT TO authenticated
  USING (facility_id IN (
    SELECT facility_id FROM facility_users WHERE email = auth.email()
  ));
