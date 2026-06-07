import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { env } from "../env.js";

// --- Config shape (only the parts the server uses) -------------------------

export interface Member {
  name: string;
  phone: string;
  tier: string;
  active: boolean;
}

export interface Court {
  id: string;
  label: string;
  mode?: "full" | "half";
}

export interface Sport {
  id: string;
  name: string;
  courts: Court[];
  splittable?: boolean;
  ask_full_or_half_before_booking?: boolean;
  pricing_per_hour_inr: Record<string, number>;
}

export interface MemberWindow {
  label: string;
  weekdays: string[];
  start: string;
  end: string;
  applies_to_sports: "all" | string[];
}

export interface Group {
  id: string;
  label: string;
  member_phones: string[];
}

export interface SeedBooking {
  court_id: string;
  sport: string;
  date_offset_days: number;
  start_time: string;
  end_time: string;
  source: string;
  booked_by_phone?: string;
  booked_by_name?: string;
  _disabled?: boolean;
}

export interface FacilityConfig {
  facility: {
    id: string;
    name: string;
    timezone: string;
    open_time: string;
    close_time: string;
    default_greeting: string;
  };
  slot_rules: {
    min_duration_minutes: number;
    default_duration_minutes: number;
    max_duration_minutes: number;
    advance_booking_days: number;
  };
  sports: Sport[];
  member_only_windows: MemberWindow[];
  member_window_release_policy: { release_minutes_before_slot_start: number };
  members: Member[];
  groups: Group[];
  group_restriction_rule: {
    block_window_hours_before_start: number;
    block_window_hours_after_start: number;
  };
  demo_seed_bookings: SeedBooking[];
}

// --- Loading ---------------------------------------------------------------

// dev:  agent/server/src/facility  →  ../../../facilities  = agent/facilities
// prod: agent/server/dist/facility →  ../../../facilities  = agent/facilities
const here = path.dirname(fileURLToPath(import.meta.url));
const FACILITY_DIR =
  env.FACILITY_DIR ?? path.resolve(here, "../../../facilities/raheja-ileseum");

let configCache: FacilityConfig | null = null;
let promptCache: string | null = null;

export function loadFacilityConfig(): FacilityConfig {
  if (!configCache) {
    const raw = readFileSync(path.join(FACILITY_DIR, "config.json"), "utf8");
    configCache = JSON.parse(raw) as FacilityConfig;
  }
  return configCache;
}

function loadSystemPromptTemplate(): string {
  if (!promptCache) {
    promptCache = readFileSync(path.join(FACILITY_DIR, "system-prompt.md"), "utf8");
  }
  return promptCache;
}

/** Render the system prompt, substituting {{handlebars}} runtime variables. */
export function renderSystemPrompt(vars: Record<string, string>): string {
  let out = loadSystemPromptTemplate();
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}
