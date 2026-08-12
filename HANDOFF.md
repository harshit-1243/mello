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

GitHub repos (both owned by `harshit-1243`):
- **mello.ai** → **https://github.com/harshit-1243/mello** (current working branch **`figma-dashboard`**, not merged to `main`; `main` auto-deploys the marketing site to Vercel)
- **mello-outbound** → **https://github.com/harshit-1243/mello-outbound** (branch `main`)

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

---

## Session 2026-07-01 — purple site SHIPPED LIVE + outbound agent latency/quality overhaul

### ▶▶ START HERE NEXT SESSION: the OUTBOUND AGENT (mello-outbound) ◀◀
This is what we were mid-flight on. The agent now **works for a live demo** (instant greeting, ~1–2s replies, multi-turn, completes the task itself, Hindi-English via Sarvam). Current goal: a **genuine "Namastey Salon" marketing call**.

**Run it (PowerShell):**
```powershell
cd C:\Users\HARSHIT\OneDrive\Desktop\mello-outbound\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000   # MUST use .venv python
# ngrok (reserved domain) in another terminal — exe is at C:\Users\HARSHIT\OneDrive\Desktop\ngrok.exe:
C:\Users\HARSHIT\OneDrive\Desktop\ngrok.exe http --domain=village-twine-strangle.ngrok-free.dev 8000
```
**Place a call** (allowlist permits ONLY Harshit's number `+918369851507`):
```
curl -X POST http://localhost:8000/clients/1/test-call -H "Content-Type: application/json" -d "{\"to\":\"+918369851507\",\"campaign_id\":6}"
```
Campaigns: `1`=booking_confirmation, `2`=membership_renewal, `4`=lead_qualification, `6`=promo_offer (the salon marketing one). Watch `backend_run.log`: `Generating TTS: [...]` = what Mello says, `CerebrasLLMService TTFB`, `Bot started/stopped speaking`, tool calls, `transcript=`.

### What was fixed this session (outbound)
1. **Latency 16s → ~1s.** Cerebras `zai-glm-4.7` is a *reasoning* model (thinks before speaking); Sarvam's own LLMs (`sarvam-30b/105b`) also reason heavily (5s+, never emit `content`) — both unusable for voice. **Fix: `CEREBRAS_MODEL=gemma-4-31b`** in `mello-outbound/backend/.env` (non-reasoning, ~0.4–1s TTFT, does tool-calls, great Hinglish). Cerebras models on this key: `zai-glm-4.7`, `gpt-oss-120b`, `gemma-4-31b`. **KEPT Sarvam STT+TTS = the Hinglish moat** (research: OpenAI Realtime/global S2S are *worse* at Hinglish, 22–34% WER — do NOT move STT/TTS off Sarvam).
2. **"Agent does it, not a team."** `app/voice/outbound_tools.py` `log_interest` message → "I've set that up for you right now… confirmation on WhatsApp." Added a system-prompt rule in `app/voice/outbound_prompts.py` (Mello acts itself, never defers to a human team; only `transfer_to_human` if asked).
3. **Offer injection.** `build_outbound_system_prompt` now feeds context `service`/`offer`/`when` into the prompt (`# What you know` block) so the agent pitches a *specific* offer.
4. **Salon rebrand (`demo.db`):** Client 1 `business_name` → **"Namastey Salon"**; Monsoon Glow offer set on contact 30.

### ⚠️ IMMEDIATE NEXT STEP (where we stopped)
`/test-call` picks a *fresh pending contact* (it grabbed contact **43**, not contact 30) → the salon **offer context wasn't applied** to the call that ran. **Fix: set the Monsoon Glow offer `context_json` on ALL campaign-6 contacts** (so whichever is picked has it), then re-fire `campaign_id=6`. Use `service`="hair spa & facial", `offer`="our Monsoon Glow special — 40% off any hair spa or facial, plus a complimentary head massage, all through this month".

### Outbound gotchas
- **Cold start:** first call after a restart reloads Silero VAD + Smart Turn v3 (~5–8s) → greeting lags once. **Warm with one throwaway call before demoing.**
- **Turn-detection adds ~1.2s** after the caller stops (Smart Turn + endpointing) — not tuned; reply feels ~2–3s. Lower VAD `stop_secs` / lighten turn model if crisper needed.
- One `transcript=None` (dropped Sarvam STT turn) seen — intermittent.
- Cerebras/Sarvam free tier fine for a single demo; can rate-limit under volume.
- uvicorn does NOT auto-reload — restart after any code/.env change.

### Website (mello.ai) — SHIPPED to `main`, LIVE on melloai.in
- **Domain LIVE:** melloai.in (GoDaddy DNS → Vercel A `76.76.21.21` + CNAME `cname.vercel-dns.com`). `SITE.domain` = `melloai.in`.
- **Hero reverted** from the WebGL orb to the **conversation/call-panel** (orb experiments parked in `Orb3D.tsx`, unused); renders lavender via tokens.
- **Brand:** AA-safe violet CTA `#7c3aed`, gold accent `#f5b544`, violet-black stage `#160f1e`, **Bricolage Grotesque** display font, glowing-violet `CustomCursor`, pure-CSS hero load-in (`.hero-rise`).
- **New pages:** `/about`, `/contact` (real routes + nav links) with `.aurora` bg, `SplitReveal` headlines, `Spotlight` cards. New `Outbound.tsx` homepage section. Nav in `src/lib/site.ts` (`NAV_LINKS`); `Nav.tsx` handles `/route` vs `#anchor`.
- **Motion:** `SlidingNumber` counter, `TextLoop` (rotating verticals), `ScrollProgress` (top bar, hidden on /dashboard), `.text-shimmer` on the 24/7 pill.
- **`/dashboard` gated:** `src/proxy.ts` redirects /dashboard → home on public domains (melloai.in, *.vercel.app); works on localhost. **Interim — replace with real per-client Supabase auth later.**
- **Dashboard recolored** cyan → gold (`#F5B544` family); violet/rose/dark kept (8 files, inline hex).
- **Socials:** Instagram `instagram.com/mellooo.ai`; **X removed**. ⚠️ **LinkedIn still placeholder** (`linkedin.com/company/mello-ai`). **Email** `support@melloai.in` (GoDaddy "Professional Email by Titan", mailbox being created).
- Build gotcha: `next build` type-checks (dev/Turbopack doesn't) — fixed `LucideIcon` typings + `Reveal`/`SplitReveal` via `createElement`. Clear `.next` if `EPERM unlink` (OneDrive lock) build error.

### Lead-scraper (committed to `main`, `lead-scraper/`)
Pure-stdlib Python lead-gen. Produced **5,684 deduped callable companies** → `lead-scraper/exports/mello_leads_callable_*.csv` + per-metro splits. OSM seed (free) + website scrape + optional Google Places (key-gated; demo key should be deleted). `leads.db`/`exports/`/`*.log` gitignored.

### Website pending / parked
- LinkedIn real URL + confirm `support@melloai.in` works.
- SEO: Google Search Console + sitemap (planned next).
- Pricing-section swap (old ₹ cards still there — user will pick a replacement section).
- Mobile pass; delete stray `main` file in repo root.

*Last updated: 2026-07-01 — SHIPPED purple site live to melloai.in (conversation hero, /about + /contact, Outbound section, motion, gold dashboard, dashboard gated); fixed outbound latency 16s→~1s via gemma-4-31b (kept Sarvam Hinglish) + "agent acts itself" + offer-injection; mid-flight on Namastey Salon marketing call (campaign 6) — NEXT: apply offer context to the picked contact, re-fire.*

---

## Session 2026-07-09 — real-estate reskin (Paradise Group), per-call transcripts + Sales Handoff, outbound agent tuning, Paradise send-package

### Dashboard (mello.ai, `figma-dashboard` — pushed to GitHub)
- **Full real-estate reskin → Paradise Group** on every page: Enquiries (was Calls), Site Visits (was Bookings — Unit/Tower), Leads (was Members — Stage + Channel partners), **Pipeline Value** (compact ₹Cr/L), RE Reports/Playbook/Settings. Facility row + `config` updated in Supabase; `live.ts` uses a **unit-price map + tower labels** (revenue = sum of unit ticket values); `scripts/seed-supabase-mock.mjs` rewritten for RE data (leads, enquiries, site visits, RE campaigns). Deleted stale sports bookings + TEST call_logs.
- **Per-call transcript feed:** migration `005_outbound_transcript.sql` (`transcript jsonb` on `outbound_call_attempts` — RUN in Supabase SQL editor); agent syncs transcript; `/api/outbound?resource=calls`; `OutboundView` "Recent calls" with expandable transcript.
- **Sales Handoff card** per call (intent · interested unit · budget · objections [caller-only] · follow-up + "Push to Salesforce") — rule-based in `outbound.ts` `buildHandoff`, no extra LLM.

### Outbound agent (mello-outbound, `main` — committed this session)
- Prompt/tools: **numbers-in-English**; **books on a clear yes** (no loop); **answer-only** (no re-pitch, no booking-push after facts); **objection-handling** framework + per-client rebuttals via `context['objections']`; **project FAQ** via `context['faqs']`; **date-capture** (`when` arg on `log_interest`); **emojis removed** (Sarvam TTS errors on emoji-only chunks — was the 🙏 close).
- **Barge-in:** VAD `start_secs` 0.2→**0.1**. **`retry_timeout_secs`** ended at **5.0** (was 3.5 too low → killed slow replies; 12 too high → 12s dead air). Free tier still stalls sporadically.
- **LLM = Cerebras `gemma-4-31b` with a NEW key** (old key was quota-throttled → 10–40s stalls). Tested & rejected on Groq: llama-3.3 (Hindi numbers + `<function=>` text leak), gpt-oss-120b (reasoning model → silent on tool-call), kimi-k2 (not on the account). Unused `GROQ_API_KEY` still in `.env`.
- **Twilio → a second account** (SID starts `ACb8ff8…`, Trial; full SID in `backend/.env`): has **Manan `+919653679703`**, Harshit, Bitu verified; FROM = **`+16088563292`**. (Root cause of the earlier Manan failures: TWO Twilio accounts — Manan was verified on this one, not the old `ACbb08…` that only had Harshit.) `OUTBOUND_TEST_NUMBERS` = both numbers.
- Demo contacts **43 (Harshit) / 44 (Manan)**, campaign 6 ("New project launch" = Supabase campaign 27): **Paradise Skyline, Sector 12 Kharghar**; short pitch; FAQ (project name/size/location/amenities) + 3 objections; prices 2BHK ₹85L / 3BHK ₹1.4Cr — **all placeholders, swap for real Paradise facts before a client demo.**

### Paradise Group send-package (on Desktop — email SENT by user 2026-07-09)
- 5 attachments, all fixed to **Harshit Modi · support@melloai.in · +91 83698 51507**, "Mello AI" brand, softened claims: `Mello_Proposal_Paradise_Group (2).docx`, `Mello_MoM_ParadiseGroup_2026-07-06.docx` (attendee **Sanket Chougule, Marketing**), `Mello_Salesforce_Integration.docx`, `Mello Real Estate.pptx.pdf`, demo video. Also produced: `mello essentials/Mello_Outbound_Cost_Sheet_v1.xlsx`, a discovery questionnaire, an objection-handling pitch, and a Titan email signature. Follow-up: WhatsApp Sanket + the Friday call.

### Known open / next
- **Cerebras free tier stalls sporadically** (~5s capped, was 12s) → **paid LLM tier** is the real fix for a flawless recording.
- **Backchannel interruptions** — a brief "haan/ji" can cut the agent off; the proper fix is a **min-words interruption threshold** (not yet done).
- `backend_run.log` is **overwritten on each restart** (`> backend_run.log`) → prior call logs lost; per-call transcripts survive in `backend/call_logs/*.jsonl`.
- Swap all placeholder facts (Paradise Skyline / Sector 12 / prices / RERA / bank names) for real ones before client-facing use.

*Last updated: 2026-07-09 — real-estate dashboard reskin (Paradise Group) + per-call transcripts + Sales Handoff card; outbound agent tuned (English numbers, objection handling, project FAQ, faster barge-in, emoji-close fix); NEW Cerebras key + NEW Twilio account (Manan verified, dials from ACb8ff8…); Paradise proposal/MoM/deck/video package sent.*

---

## Session 2026-08-07 — ⭐ OUTBOUND AGENT = "Plej" GYM, latency/quality overhaul, WhatsApp, dashboard reskin

**▶▶ THE PRODUCT IS NOW A GYM DEMO for "Plej" (spelled Plej, pronounced "Pledge"), Bandra + Kandivali branches.** Everything below is the current, working state. Both repos pushed: `mello-outbound`→`main` (5101d0d), `mello.ai`→`figma-dashboard` (9fd4ae1).

### The demo call that WORKS (proven, use for the video)
A real hi-IN call handled 7 turns flawlessly: caller asked (in Hindi) location → gym name → which branch → timings → price → discount → then booked a free trial ("day after tomorrow"). Mello even handled an objection ("मैंने सुना है Plej जिम इतना अच्छा नहीं है" → reassured on certified trainers). Per-turn latency ~0.8–1.3s. **This transcript is seeded into the dashboard Outbound tab.**

### Current outbound agent config (mello-outbound/backend/.env — all local, gitignored)
- **LLM:** Cerebras `gemma-4-31b`, **PAID key** (`CEREBRAS_API_KEY=csk-kc6ek...` — user bought it, ~$5, fixed the free-tier 429 stalls). `reasoning_effort=low`, `max_completion_tokens=90` (hard cap; prompt targets ~12 words but model can go to ~60).
- **LLM fallback:** `CerebrasSarvamFallbackLLM` (app/voice/fallback_llm.py) — on Cerebras timeout/error, retries the turn on Sarvam **`sarvam-105b`** (the ONLY non-deprecated Sarvam LLM now; it's a reasoning model → needs `max_tokens=400` or content comes back empty). Toggle `LLM_FALLBACK_SARVAM`.
- **STT:** Sarvam `saarika:v2.5`, **`SARVAM_STT_LANGUAGE=hi-IN`**. *Critical lesson:* `en-IN` MANGLES Hindi speech into English nonsense ("Viral system", "GHMC Dharam"); `hi-IN` captures Hindi properly. STT is still imperfect (Sarvam's Hinglish weakness) — the durable fix is paid Sarvam or self-hosted **AI4Bharat** (IndicWhisper/Indic-TTS).
- **TTS:** Sarvam **`bulbul:v3` / voice `ritu`** (clear but ~3.4s synth). A/B'd against `bulbul:v2`/`anushka` (~0.9s, 3.8× faster but rougher pronunciation — user rejected v2's quality). v3 streams (first audio ~0.25s), so it's not 3.4s of dead air. **Fish Audio TTS is integrated** (providers.make_tts "fish" branch, `ormsgpack` installed) but **STAGED OFF** — Fish API returns 402 "insufficient API credit" (their platform credits ≠ API credits; needs a paid top-up at fish.audio/app/developers). `FISH_API_KEY=bd7f4a12...`, `TTS_PROVIDER=sarvam`.
- **Telephony:** Twilio TRIAL (2nd account `ACb8ff8…`), FROM `+16088563292`, dials ONLY allowlisted verified numbers (`OUTBOUND_TEST_NUMBERS=+918369851507,+919653679703` = Harshit, Manan).
- **ngrok** reserved domain `village-twine-strangle.ngrok-free.dev` → :8000 (exe on Desktop). Restart it if dead: `ngrok.exe http --domain=village-twine-strangle.ngrok-free.dev 8000`.
- **Barge-in:** `VADParams(start_secs=0.1, stop_secs=0.5)` — 0.3 clipped short turns into dropped speech (dead air); reverted to 0.1. Turn-stop `SpeechTimeoutUserTurnStopStrategy(0.2)`.
- **Brand/context:** demo.db Client 1 `business_name="Pledge"` (spelled "Pledge" so TTS pronounces it right — brand is "Plej"). Contacts 43 (Harshit) / 44 (Manan), campaign 6. Context: Bandra HQ + Kandivali branches; monthly ₹2,500 / annual ₹18,000; 6 AM–11 PM (Sun till 2 PM); offer = zero joining fee + 1 month free + 1 PT session + free trial. **All placeholder — swap for real Plej facts before a client-facing demo.**

### This session's key fixes (all committed)
1. **Keep-warm (main.py `_keep_pipeline_warm`)** — pre-loads Silero + warms Cerebras/Sarvam at boot AND every 4 min. Kills the ~17s cold-start greeting (Silero 3.4s + Sarvam STT websocket connect ~9s + first TTS ~4.2s all happen on the FIRST call after a restart). **Warmth still decays ~10 min idle** → warm fresh right before a demo (fire a few Cerebras pings + a Sarvam GET, then dial).
2. **Sarvam LLM fallback** (fallback_llm.py) — safety net vs dead air.
3. **WhatsApp** — `outbox.py` sends via **Meta WhatsApp Cloud API** on a booked/interested outcome, wired into `outbound_pipeline_tools._run` (gated on `decision.fire_confirmation`). See WhatsApp status below.
4. **Transcript dedup** (call_logger) — the greeting was double-LOGGED (spoken once); now logs once.
5. **Prompt** (outbound_prompts.py) — feminine Hindi persona (voice is female: "कर रही हूँ" not "रहा हूँ"), numbers-in-English, no-repeat-opening rule, gym-neutral objection/FAQ framing.
6. **Latency diagnosis** — the paid Cerebras key + warm-up fixed most; the felt lag was mostly (a) cold start and (b) v3 TTS synth time; **STT mangling in en-IN made calls FEEL broken** ("samajh nahi pai") until hi-IN.

### ⚠️ WhatsApp — integration DONE, delivery BLOCKED
- **Meta app "Mello"** (App ID `1284237110546528`), WhatsApp **Cloud API TEST number** `+1 555-637-1417`, **Phone Number ID `1088201357716959`**, WABA `1619558456622483`. `WHATSAPP_PROVIDER=meta` in .env.
- Code works: sends fire, Meta returns **200 "accepted"**, token quality GREEN, recipient (Harshit) verified. **But messages never DELIVERED** to the Indian phone.
- **Root causes found:** (a) the **temp 24h access token EXPIRES** (last check: 401 code 190 "Authentication Error" — the token dies daily, must regenerate on the API Setup page each time); (b) free-form text needs the recipient to first message the test number (open the 24h window — Meta's own note); (c) Meta **TEST numbers are unreliable for real delivery to Indian phones** even when accepted.
- **THE FIX = production sender:** Meta "Step 2: Production setup" (add own number as sender + business verification, ~2–3 days → permanent system-user token, reliable delivery) OR a BSP (Interakt/AiSensy/Gupshup). Manan (+919653679703) is NOT a verified test recipient (400 "not in allowed list").
- **For the demo:** the integration is proven — show Mello promising WhatsApp + the dashboard; don't block on the test-number delivery.

### Dashboard (mello.ai `figma-dashboard`) — reskinned Raheja real-estate → Plej gym
- **Supabase is UNREACHABLE from dev** (`getaddrinfo failed` for `ldzzxktgpmjgklorpigw.supabase.co` — likely the free project auto-PAUSED). So the dashboard runs on the **seed** (`src/lib/dashboard/data.ts`), which we edited: facility = **Plej · Bandra, Mumbai**, "AI Receptionist", sidebar nav Calls/Bookings/Members, Overview KPIs (Calls Today/Bookings/Revenue ₹45k) + gym activity (free trial/PT/membership — no more Badminton/Tennis/courts).
- **Outbound tab:** new **`OUTBOUND_SOURCE=seed`** branch in `outbound.ts` returns a **"Plej — Membership & Trial Drive"** campaign + the real call transcript (Manan/Harshit/Rahul) + a gym **Sales Handoff** card. Set `OUTBOUND_SOURCE=seed` in `.env.local` (that flag is gitignored — the CODE is committed).
- Deeper tabs (Calls detail, Bookings, Reports) may still show a few real-estate labels — NOT yet reskinned.
- Also added `src/app/sitemap.ts` + `robots.ts` (SEO for melloai.in — needs deploy to main + GSC verification).

### How to run (PowerShell)
```powershell
# Outbound backend (MUST use .venv python; auto keep-warm at boot)
cd C:\Users\HARSHIT\OneDrive\Desktop\mello-outbound\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# ngrok (other terminal): C:\Users\HARSHIT\OneDrive\Desktop\ngrok.exe http --domain=village-twine-strangle.ngrok-free.dev 8000
# Dashboard: cd C:\Users\HARSHIT\OneDrive\Desktop\mello.ai ; npm run dev  (:3000/dashboard, OUTBOUND_SOURCE=seed)
```
- **Place a call:** `curl -X POST http://localhost:8000/clients/1/test-call -H "Content-Type: application/json" -d '{"to":"+918369851507","campaign_id":6}'` (or Manan +919653679703).
- **Warm before a demo call:** fire 2–3 Cerebras pings + a GET to api.sarvam.ai, then dial immediately (warmth decays ~10 min).
- **Watch a call:** `backend_run.log` — `Generating TTS:` = what Mello says; `transcript='...'` = STT capture; per-turn = `User stopped speaking` → `Bot started speaking`. Per-call transcripts in `backend/call_logs/*.jsonl`.

### What's pending / next
1. **WhatsApp production sender** (the only path to real delivery — test number won't deliver). Regenerate the temp token daily if using the trial.
2. **Fish Audio A/B** — add API credit at fish.audio/app/developers, then `TTS_PROVIDER=fish` + restart to compare vs Sarvam.
3. **STT accuracy** — Sarvam Hinglish is the weak link; evaluate paid Sarvam or self-hosted AI4Bharat.
4. **Swap placeholder Plej facts** (address, real prices, timings) for real ones.
5. **Reskin deeper dashboard tabs** to gym (Calls/Bookings/Reports still have real-estate labels).
6. **Record the demo video** (Task 2) — script is written; use the warm hi-IN agent + the Outbound-tab transcript. DoD tasks 1/7/8/13 functionally covered (8 = user's live setup; 13 = WhatsApp blocked on production sender).
7. **Scripted demo mode** (scripted_demo.py/scripted_llm_wrapper.py) is committed but SHAKY/unused (not a real Pipecat FrameProcessor) — delete or rebuild properly if wanted.

*Last updated: 2026-08-07 — outbound agent is now the Plej GYM demo. Paid Cerebras key (fixed 429 stalls) + Sarvam-105b fallback + keep-warm (kills cold start) + hi-IN STT (fixed Hindi mangling) + v3 TTS + WhatsApp Meta integration (delivery blocked on test-number/expired-token → needs production sender) + Fish TTS staged (no credit). Dashboard reskinned Raheja→Plej with an Outbound seed campaign carrying the real call transcript + gym Sales Handoff. Both repos pushed.*
