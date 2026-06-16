-- Mello — Step 10.3: dashboard auth + per-facility RLS
-- Run this in the Supabase SQL editor. Safe to re-run.
--
-- What it does:
--   1. `facility_users` — the allowlist mapping a dashboard owner's EMAIL to the
--      facility they own. Magic-link sign-in only sends to emails listed here.
--   2. Per-facility RLS SELECT policies on every tenant table, keyed by the
--      signed-in user's email (auth.email()). The server still uses the SERVICE
--      key (which bypasses RLS) for the agent + dashboard reads; these policies
--      are the guarantee for any access made with the anon/user key.
--
-- After running: seed your own row at the bottom (replace the email), then add
-- NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to turn auth on.

-- ---------------------------------------------------------------------------
-- 1. Allowlist: email -> facility
-- ---------------------------------------------------------------------------
create table if not exists facility_users (
  email       text primary key,
  facility_id text not null references facilities(id) on delete cascade,
  role        text not null default 'owner',
  created_at  timestamptz not null default now()
);

alter table facility_users enable row level security;

-- A signed-in user may read only their own mapping row.
drop policy if exists facility_users_self_read on facility_users;
create policy facility_users_self_read on facility_users
  for select to authenticated
  using (email = auth.email());

-- ---------------------------------------------------------------------------
-- 2. Per-facility RLS — each owner sees only their facility's rows
-- ---------------------------------------------------------------------------
-- Make sure RLS is on for the tables that didn't have it yet.
alter table facilities    enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
-- (members, bookings, call_logs, transcripts, tool_calls already enabled in schema.sql)

-- facilities keys on `id`; everything else on `facility_id`.
drop policy if exists facilities_facility_read on facilities;
create policy facilities_facility_read on facilities
  for select to authenticated
  using (id in (select facility_id from facility_users where email = auth.email()));

drop policy if exists members_facility_read on members;
create policy members_facility_read on members
  for select to authenticated
  using (facility_id in (select facility_id from facility_users where email = auth.email()));

drop policy if exists groups_facility_read on groups;
create policy groups_facility_read on groups
  for select to authenticated
  using (facility_id in (select facility_id from facility_users where email = auth.email()));

drop policy if exists group_members_facility_read on group_members;
create policy group_members_facility_read on group_members
  for select to authenticated
  using (facility_id in (select facility_id from facility_users where email = auth.email()));

drop policy if exists bookings_facility_read on bookings;
create policy bookings_facility_read on bookings
  for select to authenticated
  using (facility_id in (select facility_id from facility_users where email = auth.email()));

drop policy if exists call_logs_facility_read on call_logs;
create policy call_logs_facility_read on call_logs
  for select to authenticated
  using (facility_id in (select facility_id from facility_users where email = auth.email()));

drop policy if exists transcripts_facility_read on transcripts;
create policy transcripts_facility_read on transcripts
  for select to authenticated
  using (facility_id in (select facility_id from facility_users where email = auth.email()));

drop policy if exists tool_calls_facility_read on tool_calls;
create policy tool_calls_facility_read on tool_calls
  for select to authenticated
  using (facility_id in (select facility_id from facility_users where email = auth.email()));

-- ---------------------------------------------------------------------------
-- 3. Seed YOUR access — replace the email with the inbox you'll sign in with.
-- ---------------------------------------------------------------------------
insert into facility_users (email, facility_id, role)
values ('you@example.com', 'raheja-ileseum', 'owner')
on conflict (email) do update set facility_id = excluded.facility_id;
