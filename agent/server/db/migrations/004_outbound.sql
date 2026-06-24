-- Mello — Outbound tables (Phase 2: unify inbound + outbound on Supabase)
-- Run this once in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS).
--
-- These are prefixed `outbound_` so they never collide with the inbound schema
-- (bookings/members already exist with a different shape). The dashboard reads
-- them via the service key; the Python outbound agent writes them via REST.

-- ---------------------------------------------------------------------------
-- Campaigns (one row per outbound campaign)
-- ---------------------------------------------------------------------------
create table if not exists outbound_campaigns (
  id             bigint generated always as identity primary key,
  facility_id    text not null references facilities(id) on delete cascade,
  name           text not null,
  objective_type text not null,                       -- booking_confirmation | membership_renewal | ...
  status         text not null default 'active',      -- active | paused | done
  budget_cap_inr numeric not null default 0,
  spent_inr      numeric not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_outbound_campaigns_facility on outbound_campaigns (facility_id);

-- ---------------------------------------------------------------------------
-- Contacts (the lead list for a campaign)
-- ---------------------------------------------------------------------------
create table if not exists outbound_contacts (
  id               bigint generated always as identity primary key,
  facility_id      text not null references facilities(id) on delete cascade,
  campaign_id      bigint not null references outbound_campaigns(id) on delete cascade,
  name             text,
  phone            text not null,                     -- E.164
  state            text not null default 'pending',   -- pending | in_flight | done | exhausted | skipped
  last_disposition text,                              -- confirmed | refused | opt_out | no_answer | ...
  attempt_count    int  not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_outbound_contacts_campaign on outbound_contacts (campaign_id);

-- ---------------------------------------------------------------------------
-- Call attempts (one row per dial; powers the campaign metrics)
-- ---------------------------------------------------------------------------
create table if not exists outbound_call_attempts (
  id          bigint generated always as identity primary key,
  facility_id text not null references facilities(id) on delete cascade,
  campaign_id bigint not null references outbound_campaigns(id) on delete cascade,
  contact_id  bigint not null references outbound_contacts(id) on delete cascade,
  answered    boolean not null default false,
  amd_result  text,                                   -- human | voicemail | ivr | unknown
  disposition text,
  duration_s  int not null default 0,
  cost_inr    numeric not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_outbound_attempts_campaign on outbound_call_attempts (campaign_id);
create index if not exists idx_outbound_attempts_contact  on outbound_call_attempts (contact_id);

-- RLS on (service key bypasses; protects future per-facility dashboard auth).
alter table outbound_campaigns     enable row level security;
alter table outbound_contacts      enable row level security;
alter table outbound_call_attempts enable row level security;
