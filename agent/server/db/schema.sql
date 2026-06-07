-- Mello — Supabase / Postgres schema (Step 7)
-- Multi-tenant: every row is scoped by facility_id. Run this in the Supabase
-- SQL editor (or via `npm run db:push`). Safe to re-run (IF NOT EXISTS).
--
-- Privacy (decision #3 — Trusted Processor):
--   * Audio is never stored (destroyed in 60s; we only persist transcripts).
--   * Transcripts auto-expire after 90 days (transcripts.expires_at + a cron purge).
--   * audit_log records every internal access to call data.
--   * Per-facility isolation via facility_id (+ RLS policies below).

-- ---------------------------------------------------------------------------
-- Facilities (one row per client facility — the tenant)
-- ---------------------------------------------------------------------------
create table if not exists facilities (
  id            text primary key,                  -- e.g. "raheja-ileseum"
  name          text not null,
  city          text,
  timezone      text not null default 'Asia/Kolkata',
  twilio_number text,
  open_time     text not null default '08:00',
  close_time    text not null default '24:00',
  config        jsonb not null default '{}'::jsonb, -- full config.json snapshot
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  facility_id text not null references facilities(id) on delete cascade,
  name        text not null,
  phone       text not null,                       -- E.164, e.g. +918369851507
  tier        text not null default 'standard',
  active      boolean not null default true,
  joined_at   date,
  created_at  timestamptz not null default now(),
  unique (facility_id, phone)
);
create index if not exists idx_members_facility_phone on members (facility_id, phone);

-- ---------------------------------------------------------------------------
-- Groups + membership (group overlap rule)
-- ---------------------------------------------------------------------------
create table if not exists groups (
  id          text primary key,                    -- e.g. "group_1"
  facility_id text not null references facilities(id) on delete cascade,
  label       text not null
);

create table if not exists group_members (
  group_id     text not null references groups(id) on delete cascade,
  facility_id  text not null references facilities(id) on delete cascade,
  member_phone text not null,
  primary key (group_id, member_phone)
);
create index if not exists idx_group_members_phone on group_members (facility_id, member_phone);

-- ---------------------------------------------------------------------------
-- Bookings (internal + external; source distinguishes them)
-- ---------------------------------------------------------------------------
create table if not exists bookings (
  id              text primary key,                -- "MLO-0001" / "HD-..." / seed id
  facility_id     text not null references facilities(id) on delete cascade,
  sport           text not null,
  court_id        text not null,                   -- internal only; never spoken to caller
  booking_date    date not null,
  start_time      text not null,                   -- "HH:MM"
  end_time        text not null,
  source          text not null default 'mello',   -- mello | hudle | khelomore | ...
  booked_by_phone text,
  booked_by_name  text,
  basketball_mode text,                            -- full | half | null
  status          text not null default 'confirmed',
  created_at      timestamptz not null default now()
);
create index if not exists idx_bookings_lookup on bookings (facility_id, sport, booking_date);

-- ---------------------------------------------------------------------------
-- Call logs (one row per phone call)
-- ---------------------------------------------------------------------------
create table if not exists call_logs (
  id            uuid primary key default gen_random_uuid(),
  facility_id   text not null references facilities(id) on delete cascade,
  call_sid      text,
  caller_phone  text,
  is_member     boolean,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  outcome       text,                              -- booked | no_booking | escalated | ...
  created_at    timestamptz not null default now()
);
create index if not exists idx_calls_facility on call_logs (facility_id, started_at);

-- ---------------------------------------------------------------------------
-- Transcripts (90-day retention; one row per utterance)
-- ---------------------------------------------------------------------------
create table if not exists transcripts (
  id          uuid primary key default gen_random_uuid(),
  call_id     uuid references call_logs(id) on delete cascade,
  facility_id text not null references facilities(id) on delete cascade,
  role        text not null,                       -- caller | mello
  content     text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '90 days')
);
create index if not exists idx_transcripts_expiry on transcripts (expires_at);

-- ---------------------------------------------------------------------------
-- Tool calls (feeds the per-facility learning loop)
-- ---------------------------------------------------------------------------
create table if not exists tool_calls (
  id          uuid primary key default gen_random_uuid(),
  call_id     uuid references call_logs(id) on delete cascade,
  facility_id text not null references facilities(id) on delete cascade,
  tool        text not null,
  args        jsonb,
  result      jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log (decision #3: audit every internal access to call data)
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  facility_id text,
  actor       text not null,                       -- "system" | user/email
  action      text not null,                       -- read_transcript | export | delete | ...
  target      text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-Level Security: each facility sees only its own rows.
-- The server uses the SERVICE key (bypasses RLS) for writes; these policies
-- protect future per-facility dashboard access via the anon/auth key.
-- ---------------------------------------------------------------------------
alter table members       enable row level security;
alter table bookings      enable row level security;
alter table call_logs     enable row level security;
alter table transcripts   enable row level security;
alter table tool_calls    enable row level security;
-- NOTE: add per-facility policies when the dashboard (Step 10) defines its auth
-- claim (e.g. auth.jwt() ->> 'facility_id'). Until then, only the service key
-- (server) writes/reads, so no anon access is granted.
