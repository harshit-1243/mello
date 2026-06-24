# HANDOFF — mello.ai

> **For the next Claude session:** read this end-to-end before asking the user anything.
> It has: the two codebases, current architecture, what's working, decisions already made (don't re-litigate), how to run everything, and what's next.
> Rewritten fresh 2026-06-22 (outbound agent + unified Supabase dashboard). Older step-by-step build history was compressed — the agent code is the source of truth for details.

---

## What mello is (60-second context)

**mello.ai** is a B2B SaaS — an AI voice receptionist for sports & recreation facilities (turfs, gyms, court complexes) in India. It handles calls in **Hindi + English code-switching**, checks live availability, enforces booking rules (membership, groups), and confirms via WhatsApp. There are now **two call directions**:

- **Inbound** — answers incoming calls, books slots. (TypeScript agent.)
- **Outbound** — Mello *calls* contacts toward one goal: booking confirmations, membership renewals, win-back, lead-qual, no-show follow-ups, promos, feedback. (Python agent.)

**Market:** India-first (Mumbai/Navi Mumbai). Pricing in ₹, per-facility (never hardcode/show a price). Moat: bilingual code-switching global bots can't do.

**User (you're talking to):** Harshit. Solo/small-team founder. Non-technical but decisive and sharp. Lowercase casual ≠ low effort. Calendly: `connect2harshit123/30min`.

---

## ⚠️ THERE ARE TWO CODEBASES

| Repo | Path | What | Stack |
|---|---|---|---|
| **mello.ai** (this repo) | `C:\Users\HARSHIT\OneDrive\Desktop\mello.ai` | Marketing site + **inbound** voice agent (`agent/server/`) + **the unified operator dashboard** (`src/app/dashboard/`) | Next.js 16, React 19, TS, Tailwind v3; agent = Fastify+TS; Sarvam models; Supabase |
| **mello-outbound** | `C:\Users\HARSHIT\OneDrive\Desktop\mello-outbound` | **Outbound** calling agent + (its own older Next.js dashboard, now superseded) | FastAPI + SQLAlchemy + SQLite; Pipecat; **Cerebras** LLM; Sarvam STT/TTS; Twilio |

GitHub for this repo: **https://github.com/harshit-1243/mello** (current working branch: **`figma-dashboard`**, not merged to `main`).

**The dashboard lives in mello.ai and shows BOTH agents.** The `mello-outbound/frontend` dashboard is the weaker, separate one we decided NOT to use — don't build there.

---

## Current architecture — ONE Supabase, both agents, one dashboard

```
INBOUND  agent/server (TS, Fastify, :8080) ──writes──┐
                                                     ├─► ONE Supabase project ──read──► mello.ai dashboard (:3000)
OUTBOUND mello-outbound (Python, FastAPI, :8000) ────┘   (ldzzxktgpmjgklorpigw)         (Next.js, reads everything)
                                                          facility: raheja-ileseum
```

**One Supabase project = one company.** Both agents live in it in **separate tables** (the user's explicit model: same project/"space", NOT same schema/tables):

| Inbound tables | Outbound tables |
|---|---|
| `facilities`, `members`, `groups`, `group_members`, `bookings`, `call_logs`, `transcripts`, `tool_calls`, `audit_log` | `outbound_campaigns`, `outbound_contacts`, `outbound_call_attempts` |

- Supabase project: **`ldzzxktgpmjgklorpigw`**, facility id **`raheja-ileseum`**. Creds (URL + service key) live in `mello.ai/.env.local`, `agent/server/.env.local`, and `mello-outbound/backend/.env`.
- Inbound schema: `agent/server/db/schema.sql` (+ migrations `001`–`003`). Outbound schema: `agent/server/db/migrations/004_outbound.sql` (already run in Supabase SQL editor this session).
- DDL note: creating tables needs the Supabase **SQL editor** (or the Postgres connection string). The service key can only CRUD existing tables over REST — it cannot run DDL.

---

## What's working right now (verified this session)

### Marketing website ✅ shipped
- Live: **https://mello-omega.vercel.app**, auto-deploys from `main`. Next.js 16 + GSAP + Lenis. (Untouched recently.)

### Inbound agent ✅ works + persists to Supabase
- `agent/server/` (Fastify + TS). Flow: Twilio call → Media Stream → Sarvam STT → brain (`sarvam-105b` + tools) → Sarvam TTS (`bulbul:v3` `ritu`) → caller. Booking engine: availability, member-only windows + T-30 release, group ±2h conflict, court abstraction.
- **Browser/mic test console** at `:8080/test` (the dashboard's "Test Mello" page links to it). Runs the real `CallAgent`.
- **VERIFIED this session:** a test-console session created a `call_logs` row + transcripts in Supabase, and it showed on the dashboard Calls page. Inbound → Supabase → dashboard works.
- Live PHONE inbound is still blocked only by a **Twilio number** (KYC pending). Mic/console works now.
- Run: `cd agent/server && npm run dev` → `:8080`.

### Outbound agent ✅ works + makes real calls + mirrors to Supabase
- `mello-outbound/backend/` (FastAPI). Pipecat → Silero VAD → **Sarvam STT** → **Cerebras** LLM (`zai-glm-4.7`, reasoning=low) → **Sarvam TTS** → caller. SQLite `demo.db` is the engine's source of truth.
- **Live outbound calling WORKS** (unlike inbound) — uses a **Twilio trial number** (`+13136376612`) that can dial the **allowlisted** verified number (Harshit's `+918369851507`). Endpoint: `POST /clients/1/test-call {"to","campaign_id"}` (allowlist-gated). ngrok tunnel in `.env` (`PUBLIC_BASE_URL`).
- 7 objectives, each with the right tools (see fixes below). Booking-confirmation can confirm/reschedule/cancel a real booking.
- **Live calls mirror into Supabase** via `app/voice/supabase_sync.py` (REST + service key, matched to campaign by NAME), called from `_run` in `outbound_pipeline_tools.py`. **VERIFIED:** driving the real tool path wrote a contact+attempt into the outbound tables and it showed on the dashboard.
- Run: `cd mello-outbound/backend && .venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000`. **MUST use `.venv/Scripts/python.exe`** — the global Pythons (3.8 / 3.12) lack the deps.

### Unified dashboard ✅ shows inbound + outbound from Supabase
- `mello.ai/src/app/dashboard/` (Next.js, Figma dark design). Pages: Overview, Calls, **Outbound** (NEW), Bookings, Members, Playbook, Test Mello, Reports, Settings.
- Reads everything from Supabase. Outbound reads the `outbound_*` tables (metrics computed in TS) when `OUTBOUND_SOURCE=supabase` (set in `.env.local`).
- Auth is **OFF for local** (`authConfigured` false — `NEXT_PUBLIC_SUPABASE_*` commented in `.env.local`), so `/dashboard` opens directly.
- Run: `cd mello.ai && npm run dev` → `:3000/dashboard`.

### Mock data for demos ✅ seeded into Supabase
- `mello.ai/scripts/seed-supabase-mock.mjs` (Node, supabase-js, service key). Seeds **50 inbound calls** (+25 members, 24 bookings, transcripts) and **52 outbound contacts across 7 campaigns**. Idempotent (mock rows tagged `MOCK-*` / `+9199…` and deleted before re-insert). Live tests append on top untouched.
- Run: `cd mello.ai && node scripts/seed-supabase-mock.mjs`. Verified rendering: 53 calls today, 72% answer rate, ₹12,400 revenue, all 7 outbound campaigns.

---

## This session's changes (2026-06-22) — don't redo

### Outbound agent fixes (`mello-outbound/backend`)
1. **Per-objective LLM tools** — `build_outbound_tools_schema(objective)` now hands the model only that objective's tools. Before, only booking-confirmation tools were registered, so renewal/reactivation/lead-qual/no-show/promo/feedback could NOT complete (their prompts named `mark_renewal`/`log_interest`/`record_feedback`/`decline` but those weren't in the schema). Guarded by `tests/test_outbound_tool_coverage.py`. **7/7 objectives verified driving the right tool via Cerebras.**
2. **Terminal tools hang up** — a terminal tool now sets `run_llm=False`, speaks its one closing line, then `task.stop_when_done()`. Fixes: (a) the call not ending after "confirmed", (b) one call firing TWO dispositions. In `outbound_pipeline_tools.py` + both entry points (`phone_call.py`, `outbound_bot.py`).
3. **Supabase mirror** — `supabase_sync.py` + config fields (`supabase_url`, `supabase_service_key`, `outbound_facility_id`) + `.env` creds.

### Dashboard Phase 1 → Phase 2 (`mello.ai`)
- **Phase 1:** Outbound section added — `src/lib/dashboard/outbound.ts` (swappable source via `OUTBOUND_SOURCE`), proxy `src/app/api/outbound/route.ts`, page `src/app/dashboard/outbound/{page,OutboundView}.tsx`, nav item in `src/components/dashboard/Sidebar.tsx`.
- **Phase 2:** outbound unified into Supabase — migration `004_outbound.sql` (run), `outbound.ts` supabase branch computes metrics in TS, `OUTBOUND_SOURCE=supabase` in `.env.local`. FastAPI is no longer needed for dashboard *reads* — only to *place* live outbound calls.

### Tests + artifacts
- `mello-outbound`: `TEST_PLAN_OUTBOUND.md`, `tests/test_outbound_agent_flows.py`, `tests/test_outbound_tool_coverage.py` (full outbound suite ~98 passing), seeders `app/seed_outbound_all.py`, demo/e2e scripts `demo_agent_to_dashboard.py` / `test_e2e_outbound.py`, latency benches `bench_cerebras_latency.py` / `bench_objectives_llm.py`.
- Cerebras latency measured: TTFT ~0.4–0.5s short prompts, ~2–3s with the long booking prompt; **free tier rate-limits (429) under load** — a real scaling risk (consider paid tier / fallback before volume).

---

## Hard decisions (don't re-litigate unless user asks)

1. **Tailwind v3, not v4** (marketing). Token-based. No `@theme inline`.
2. **Multi-tenant SaaS** — one codebase, one deploy, each facility = one row. Never fork per client.
3. **Privacy = "Trusted Processor"**, not E2E. Data in India · audio destroyed ~60s · transcripts 90 days · audit logs · per-facility isolation. This-facility model improvement allowed. Don't propose E2E / "we can't read it".
4. **Visual identity = lavender/violet (2026-06-24 overhaul — supersedes the old green).** Brand colour family is purple/orchid, taken from the salon deck + reference orbs.
   - **Marketing site (light):** tokens in `globals.css` `:root` — bg `#F5F1FA`, ink `#1D1726`, brand/CTA `#8B3DB8` (token name still `green`), signal `#C95CCB`, secondary/`amber` `#867EB2`, dark "stage" `#160F1E`. Hero bg = violet gradient.
   - **Dashboard (dark, inline styles):** bg `#0E0A1E`, card `#181030`, inset `#20183C`, border `#2A2348`, text `#F3F1FB`, muted `#8C86A8`. **Semantic colours (consistent on every page):** violet `#A78BFA` = primary/booked/active; **cyan `#34D6E0` = money & key metrics & charts (the "pop")**; grey `#8C86A8` = handled/neutral; rose `#F87171` = missed/refused/negative. NO orange, NO rainbow chart colours. `DashUI.tsx` is legacy/unused — ignore it.
   - **Logo:** real glass-orb image at `public/logo/orb.png` (circular, transparent), rendered by `LogoOrb` via `.logo-orb-img`. (Replaced the old green `orb.mp4` and the interim CSS orb.)
   - **Hero:** the centerpiece is a real WebGL audio-reactive orb — `Orb3D.tsx` (React Three Fiber: distorted metallic blob + Lightformer env + bloom) inside `HeroCall.tsx` (tap to play `public/audio/hero-call.wav`, a Sarvam-voiced English call; Web Audio analyser drives the orb; transcript shows as synced captions). No play button. `three`/`@react-three/fiber`/`drei`/`postprocessing` installed.
5. **Standardize on the mello.ai dashboard** (Figma, Supabase, auth) — NOT the `mello-outbound/frontend`. Add features here.
6. **One Supabase per company; inbound + outbound in SEPARATE tables in that one project** (user's explicit model — same space, not same schema). `outbound_` prefix.
7. **Outbound data source is swappable** (`OUTBOUND_SOURCE`): `supabase` (current) reads Supabase; `fastapi` reads the Python backend via proxy. Keep both branches working.
8. **Dashboard analytics = real outcomes only.** No sentiment/Hindi-accuracy/uptime vanity stats. **Never show a subscription price** (per-facility, changes — see `payment-provider-swappable` memory).
9. **Audio is NEVER played back** in the dashboard (not stored). Transcripts only.
10. **Inbound brain = Sarvam** (`sarvam-105b`); **outbound brain = Cerebras** (`zai-glm-4.7`). Both India-friendly, tool-calling, free tiers. OpenAI = fallback only.
11. **Voice/agent conduct:** English first, switch to Hindi if caller does; never identify as AI unless asked; never say court numbers on a call (court only in WhatsApp); all-booked → suggest a different TIME, never a different sport; member-only / group / external conflicts → just "booked", no reasons.
12. **Hosting:** voice backends on laptop+ngrok for demos, Railway/Render later. **Never Vercel for the voice backends** (needs persistent WS). Vercel = marketing + dashboard only.

---

## How to run the full stack locally

```powershell
# 1. Outbound agent (Python) — needed only to PLACE live outbound calls
cd C:\Users\HARSHIT\OneDrive\Desktop\mello-outbound\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000   # :8000

# 2. Inbound agent (TS) — needed for the mic/Test Mello console
cd C:\Users\HARSHIT\OneDrive\Desktop\mello.ai\agent\server
npm run dev                                                                      # :8080

# 3. Dashboard (Next.js) — reads everything from Supabase
cd C:\Users\HARSHIT\OneDrive\Desktop\mello.ai
npm run dev                                                                      # :3000/dashboard

# Re-seed demo data anytime (idempotent)
node scripts/seed-supabase-mock.mjs
```

- **Place a live outbound call:** `curl -X POST http://localhost:8000/clients/1/test-call -H "Content-Type: application/json" -d '{"to":"+918369851507","campaign_id":2}'` (campaign_id 2 = renewal; allowlist only permits Harshit's number).
- **Run outbound tests:** `cd mello-outbound/backend && .\.venv\Scripts\python.exe -m pytest tests/test_outbound_*.py -q`.

---

## The demo facility — Raheja Ileseum (unchanged)

Mumbai sports facility. Full data in `agent/facilities/raheja-ileseum/config.json`; behavior in `system-prompt.md`.
- Hours 8 AM–12 AM. Sports: badminton (3), tennis (1), pickleball (3), basketball (1, splittable). Non-member ₹/hr: badminton 600, tennis 1200, pickleball 600, basketball 1600/half 800. **Members pay ₹0.**
- Member-only windows 8–10 AM & 9–11 PM, released 30 min before if unbooked.
- **Members (real, for live demo):** Harshit `+91 83698 51507`, Manan `+91 96536 79703`, Bitu `+91 89760 19902`, Kush `+91 84796 41500`, Krit `+91 89375 04721`.
- **Groups:** G1 = Harshit/Manan/Bitu; G2 = Kush/Krit/Bitu (Bitu in both → group-conflict demo). Group rule: same sport within ±2h of another group member's booking → blocked (just "booked").

---

## How the user likes to work

- **Announce before each step** ("I'm about to do X — here's why").
- **Present choices as tables / numbered options.** Use `AskUserQuestion` for genuine decisions, not trivia.
- **No walls of text.** They scan — headings, bullets, tables.
- Non-technical but smart — explain unfamiliar things once, then assume it.
- They paste screenshots/concerns and are usually right that something's broken — look carefully.

---

## Gotchas / environment quirks

- **Outbound Python:** always `.venv\Scripts\python.exe` (global Pythons lack deps). The running uvicorn does NOT auto-reload — restart it to pick up code/.env changes.
- **Claude Code `preview_screenshot` times out** on these dashboards (continuous polling + animated logo never reach network-idle). **Verify by reading the DOM via `preview_eval`** instead (reliable this whole session). For marketing-site shots, `scripts/shot.mjs` (puppeteer) also works.
- **Supabase REST + `+` in phone filters:** a raw `+` in a URL becomes a space → false "no match". Use httpx/supabase-js **params** (auto-encode) or `%2B`.
- **Ports:** dashboard and `mello-outbound/frontend` both default to 3000 — only run one on 3000 (the backend CORS allows `localhost:3000`). Kill stale node: `Get-Process node | Stop-Process -Force`.
- **OneDrive** makes file-watching flaky and cold-starts slow (warm with a request before checking). Delete corrupt cache: `Remove-Item -Recurse -Force .next`.
- **PowerShell:** no `&&`/`||` chaining (`; if ($?) {}`), no Unix `head`/`tail` (`Select-Object -First/-Last`).
- **`src/proxy.ts`** is the Next.js 16 middleware (renamed from `middleware.ts`).

---

## Git workflow

```powershell
git add -A
git commit -m "describe the change"
git push origin <branch>   # current branch: figma-dashboard
```
This session's work is uncommitted on `figma-dashboard`. `.gitignore` excludes `/.next/`, `scripts/shots/`, dev scripts, `.claude/settings.local.json`. The outbound repo (`mello-outbound`) is a separate git repo.

---

## ⛔ Things explicitly NOT to do

- ❌ Build dashboard features in `mello-outbound/frontend` (use the mello.ai dashboard)
- ❌ Tailwind v4 / `@theme inline`; E2E encryption; per-client forks
- ❌ Show any subscription price in the dashboard
- ❌ Have Mello say court numbers, suggest a different sport when booked, or explain WHY a slot is unavailable
- ❌ Vercel for the voice backends (persistent WS)
- ❌ Rely on `preview_screenshot` (read the DOM); don't run two servers on :3000
- ❌ Put inbound + outbound in the same tables (separate tables, one project)

---

## What's pending / next steps

1. **Live real-world confirmation (offered, not yet done):** place a live outbound call to `+918369851507` and do a mic Test Mello — watch both land on the dashboard. (Outbound backend must be running; this was the next action when the user asked to update HANDOFF first.)
2. **Cerebras free-tier 429s** — add a fallback provider or move to paid before any campaign volume.
3. **Merge `figma-dashboard` → `main`** and re-enable dashboard auth (uncomment `NEXT_PUBLIC_SUPABASE_*` in `.env.local` + set in Vercel) when ready for production.
4. **Inbound live phone** — needs a Twilio number (KYC pending; a temp US number works). Outbound already calls live via the trial number.
5. **`escalate_to_human`** (inbound) is still a stub — wire to real notifications.
6. Optional polish: clean the 50 mock bookings' realism; per-facility RLS policies for dashboard auth; commit/cleanup the one-off bench/e2e scripts in `mello-outbound/backend`.

---

## Files to read first (priority order)

1. **`HANDOFF.md`** (this file)
2. **`mello-outbound/TEST_PLAN_OUTBOUND.md`** + `mello-outbound/backend/app/voice/` (outbound agent, tools, sync)
3. **`src/lib/dashboard/outbound.ts`** + `src/app/dashboard/outbound/` (dashboard outbound)
4. **`agent/facilities/raheja-ileseum/system-prompt.md`** + `config.json` (inbound behavior + facility data)
5. **`agent/server/db/schema.sql`** + `migrations/004_outbound.sql` (Supabase schema)

That's full context in <5 minutes. Then ask the user what they want, or proceed with step 1 above if they say "continue."

---

## Session 2026-06-24 — branding + visual overhaul (this session)

- **Recoloured the whole product green → lavender/violet** (see decision #4). Marketing tokens in `globals.css :root`; dashboard recoloured across all ~22 files (inline hex swap); favicon `icon.svg` repainted.
- **New hero**: replaced the static call-panel with a **WebGL audio-reactive orb** (`Orb3D` + `HeroCall`) that plays a real English Sarvam call with synced captions, on a violet gradient bg. Audio generated by `agent/server/gen-hero-audio.mjs` (Sarvam TTS → `public/audio/hero-call.wav` + `hero-call.json`).
- **Logo** → real glass-orb image (`public/logo/orb.png`, processed from the user's file: circular crop + transparent).
- **Dashboard cohesion**: locked the violet/cyan/grey/rose semantic system on every page; killed orange + rainbow chart/avatar colours; **cyan = money/metrics** pop (Revenue, Reports charts, call amounts, half the member avatars). Mock seeder `scripts/seed-supabase-mock.mjs` (50 inbound + 52 outbound, idempotent; bookings dated today-IST so revenue counts).
- **Motion lib added** (`motion`) for cursor-reactive bits; `TiltCard`/`VoiceOrb` exist (CTA orb).
- Branch `figma-dashboard` (NOT merged to main → live marketing site still green until merged). Auth still off locally.
- **Call-flow sales diagrams (Task 2, not built yet):** plan = Recraft.ai (illustrations) + Canva (assemble), one labelled pictorial strip per sector (clinics/salons/gyms/turfs) inbound+outbound; "lavender voice-line" concept; prompts already given to the user. Not started in code.

*Last updated: 2026-06-24 — lavender/violet rebrand: WebGL audio orb hero, glass-orb logo, full dashboard recolour with cyan money-accent. Prior: 2026-06-22 outbound+Supabase unification.*
