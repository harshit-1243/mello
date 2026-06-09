# HANDOFF — mello.ai

> **For the next Claude session:** read this end-to-end before asking the user anything.
> It contains: project state, decisions already made (don't re-litigate), what's next, and how the user likes to work.
> Last updated by: previous Claude session.

---

## What mello is (60-second context)

**mello.ai** is a B2B SaaS — a 24/7 AI voice receptionist for sports & recreational facilities (turfs, gyms, court complexes) in India. It answers every inbound call, understands **Hindi + English code-switching**, checks live availability, enforces booking rules (membership, groups, etc.), and confirms via WhatsApp in ~30 seconds.

Three products under one platform:
- **Mello Voice** — the AI phone receptionist
- **Mello Book** — the booking rules engine + admin dashboard
- **Mello Chat** — WhatsApp confirmations / reschedules

**Market:** India-first (Mumbai/Navi Mumbai launch). Pricing in ₹. Positioning: globally capable, India-launched. The moat is bilingual code-switching that global voice bots (Bland, Retell, Synthflow) can't do.

**User (you talking to):** Harshit. Solo / small team founder. Non-technical but decisive. Calendly: `connect2harshit123/30min`.

---

## Current state

### Marketing website ✅ SHIPPED
- Live at: **https://mello-omega.vercel.app**
- GitHub: **https://github.com/harshit-1243/mello** (`main` branch)
- Stack: **Next.js 16 + React 19 + TypeScript + Tailwind v3 + GSAP + Lenis + Geist**
- All 10 sections from `BUILD_PROMPT.md` are present with real copy
- Cinematic motion (pinned hero scrub, kinetic split-text, custom cursor, magnetic CTAs, rounded overlapping stage/paper sections, kinetic marquee, Statement display-xl beat)
- Reduced-motion fallbacks honoured throughout
- Vercel auto-deploys on every `git push origin main`
- All `Book a Demo` CTAs → `SITE.CALENDLY_URL` in `src/lib/site.ts`

### Voice agent — Steps 1–8 SHIPPED (in `agent/server/`)
Full bilingual voice agent works end-to-end. Stack: **Fastify + TypeScript**, all
models from **Sarvam** (STT `saaras` streaming, LLM `sarvam-105b`, TTS `bulbul:v3`
`ritu`), telephony via **Twilio Media Streams**, persistence in **Supabase**.
- Flow: Twilio call → `<Connect><Stream>` → `/voice/stream` WS → μ-law→PCM →
  Sarvam STT → brain (`sarvam-105b` + 6 tools) → Sarvam TTS (μ-law 8k) → caller.
- **Browser test console at `GET /test`** — chat with Mello + hear her, no phone needed.
- Booking-rules engine: availability, member-only windows + T-30 release, group
  ±2h conflict, court abstraction — DB-backed (Supabase), config fallback.
- Privacy: audio never stored · 90-day transcript purge · audit log · per-facility
  isolation · `delete_my_data`.
- Lots of behavioral hardening done (language matching, decline/insist handling,
  closed/past/unsupported-sport, court-leak fix, error resilience).
- Run it: `cd agent/server && npm run dev` → http://localhost:8080/test
- See `agent/server/README.md` for full details.

### Pending
- **Step 10 (NEXT):** facility owner dashboard (login, see calls/transcripts/bookings, delete). **Step 11:** learning loop.
- Step 9 ✅ done (WhatsApp confirmation + Razorpay link, graceful stubs). Needs WhatsApp + Razorpay creds in `.env.local` to actually send/charge.
- **Twilio number** — KYC pending; blocks the live PHONE demo (test console works now).
- Logo (user prefers streetwear / Jordan Jumpman energy, NOT abstract painting NOT M-monogram)
- `/privacy` and `/security` pages on the marketing site (discussed, not built)

---

## Hard architectural decisions (don't re-litigate)

These were debated and decided. Don't reopen unless user asks:

1. **Tailwind v3, not v4.** We deliberately downgraded from the scaffold. Token-based via `tailwind.config.ts` + CSS vars in `globals.css`. Do NOT suggest `@theme inline` or v4 syntax.
2. **Multi-tenant SaaS, not per-client custom builds.** ONE codebase, ONE deployment, each facility = one row in a DB. NEVER "fork the code for this client."
3. **Privacy = "Trusted Processor" model**, not E2E encryption. Data stays in India · audio destroyed in 60s · transcripts 90 days · audit logs · per-facility isolation · never sold or shared. Internal model training on bookings is allowed (this-facility scope). Do NOT propose E2E or "we can't read it" claims.
4. **21st.dev Magic MCP doesn't work reliably here** — keeps timing out / redirecting. Hand-build components. Don't suggest invoking it.
5. **Claude Code's `preview_screenshot` keeps timing out** because the preview window reports `visibilityState: hidden` — browser pauses the compositor. Use `scripts/shot.mjs` (puppeteer-core + installed Chrome) instead. Tested + reliable.
6. **Logo style: streetwear/Jumpman silhouette energy.** User rejected: abstract brushstrokes, M-monograms, waves/soundbars, AI-cliché sparkles, geometric primitives.
7. **Voice agent: speaks ENGLISH FIRST**, switches to Hindi if caller does. Never identifies as AI unless directly asked.
8. **Court abstraction:** Mello NEVER says court numbers during a call ("Court 1 is open" is banned). The system silently assigns a court. Court # only appears in the WhatsApp confirmation.
9. **All-booked policy:** if a sport is fully booked at a time, suggest a different TIME for the same sport — NEVER a different sport.
10. **Group conflict + member-only + external platform** rejections all just say "booked." No reasons given to caller.
11. **LLM brain = Sarvam, not OpenAI.** Sarvam's chat API (`sarvam-30b` / `sarvam-105b`, legacy `sarvam-m`) is OpenAI-compatible and supports `tools` / `tool_choice` function calling — confirmed in the SDK types. Chosen over OpenAI because: one vendor (already signed up, free tier, one key), Indian-built so stronger on Hindi/Indic + code-switching (the moat), and data stays in India (aligns with privacy decision #3). OpenAI account stays as a fallback only. Default `sarvam-105b` + reasoning=medium (30B was slower AND off-persona in testing).
12. **"Learning from calls" is a DATA PIPELINE, not live model training.** We use a hosted LLM (Sarvam) — you can't retrain it per call. The privacy rule grants the RIGHT to use this-facility data; the mechanism is: store (Step 7) → improve prompt/examples/memory (Step 11) → optional fine-tune later. Don't promise "the model learns on every call" literally.
13. **LiveKit vs Sarvam is NOT either/or — different layers.** Sarvam = the models (STT/LLM/TTS). LiveKit = real-time orchestration/plumbing (WebRTC, turn detection, barge-in) that USES providers like Sarvam. Voice quality is a TTS choice (Sarvam v3 ritu chosen — best for India/Hindi/data-residency), NOT something LiveKit fixes. LiveKit only helps the PLUMBING latency + adds barge-in; it can't speed up the LLM tool-call time (the biggest chunk). Decision: keep Sarvam+current stack for the demo; consider LiveKit for production polish later (it can still run Sarvam underneath).

---

## Project layout

```
mello.ai/
├── BUILD_PROMPT.md              ← original brief (read for marketing context)
├── AGENTS.md                    ← "Next.js 16 differs from training data" warning
├── HANDOFF.md                   ← this file
├── README.md                    ← deployment + TODO constants
├── package.json
├── tailwind.config.ts           ← design tokens
├── next.config.ts               ← pins turbopack root
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← fonts, LenisProvider, CustomCursor, FOUC guard
│   │   ├── page.tsx             ← assembles all sections in order
│   │   ├── globals.css          ← tokens as CSS vars, grain, waveform CSS
│   │   └── icon.svg             ← favicon (green tile + bars)
│   ├── components/
│   │   ├── sections/            ← Nav, Hero, MarqueeBand, Problem, Statement,
│   │   │                           Pillars, HowItWorks, Moat, SocialProof,
│   │   │                           Pricing, ClosingCTA, Footer
│   │   ├── ui/                  ← Button, Magnetic, Pill, Eyebrow, Wordmark,
│   │   │                           WaveBars, SplitReveal, Reveal, Parallax,
│   │   │                           Marquee, CustomCursor, PricingCard,
│   │   │                           Container, icons, SmoothLink
│   │   └── providers/LenisProvider.tsx
│   └── lib/
│       ├── site.ts              ← CALENDLY_URL, CONTACT_EMAIL, NAV_LINKS
│       ├── cn.ts                ← class joiner
│       ├── gsap.ts              ← registers ScrollTrigger, prefersReducedMotion
│       ├── smooth-scroll.ts     ← Lenis instance + scrollToId()
│       └── use-isomorphic-layout-effect.ts
├── agent/
│   └── facilities/
│       └── raheja-ileseum/
│           ├── config.json      ← THE facility data (members, groups, pricing, rules)
│           └── system-prompt.md ← THE agent brain
└── scripts/
    ├── shot.mjs                 ← headless puppeteer screenshot tool (USE THIS)
    └── shots/                   ← gitignored output
```

### Key constants — `src/lib/site.ts`
- `CALENDLY_URL` = `"https://calendly.com/connect2harshit123/30min"` ✅ real
- `CONTACT_EMAIL` = `"hello@mello.ai"` (still TODO — replace with real inbox)
- `social.{linkedin,twitter,instagram}` — still placeholders, do not change without asking

---

## Accounts & services

| Service | Status | Notes |
|---|---|---|
| Vercel | ✅ connected | auto-deploys from GitHub `main` |
| GitHub | ✅ `harshit-1243/mello` | push triggers Vercel |
| Calendly | ✅ live URL set | `connect2harshit123/30min` |
| Twilio | ✅ signed up | **no Indian number bought yet — KYC pending** |
| Sarvam AI | ✅ signed up (free tier) | STT + TTS **and the LLM brain** (chat API w/ tool calling) — Hindi/English |
| OpenAI | ✅ signed up | fallback only — brain switched to Sarvam (decision #11) |
| Supabase | ✅ connected | project `mello`, URL + service key in `.env.local`; schema applied + seeded; persistence LIVE |
| Razorpay | ❌ not yet | Step 9 code DONE + graceful; add `RAZORPAY_KEY_ID`/`_SECRET` (test keys) to `.env.local` to charge for real |
| Meta WhatsApp Business API | ❌ not yet | Step 9 code DONE + graceful (logs msg without creds); add `WHATSAPP_TOKEN`/`_PHONE_ID` (sandbox OK) to `.env.local` to send for real |
| Custom logo | ❌ not yet | exploring streetwear/silhouette directions |

---

## The demo facility — Raheja Ileseum

Mumbai sports facility. Used to build + demo Phase 1.

### Quick facts (full data in `agent/facilities/raheja-ileseum/config.json`)
- Hours: 8 AM – 12 AM (midnight)
- Sports: badminton (3 courts), tennis (1), pickleball (3), basketball (1, splittable into 2 halves)
- Pricing per hour (non-members): badminton ₹600, tennis ₹1200, pickleball ₹600, basketball full ₹1600 / half ₹800
- **Members pay ₹0.**
- Member-only windows: 8–10 AM and 9–11 PM all 7 days. **Release 30 min before start** if unbooked.
- Slots: min 30 min, default 1 hr, multiples of 1 hr, max 4 hr.

### Members (real numbers for live demo)
| Name | Phone | Tier |
|---|---|---|
| Harshit | +91 83698 51507 | standard |
| Manan | +91 96536 79703 | standard |
| Bitu | +91 89760 19902 | standard |
| Kush | +91 84796 41500 | standard |
| Krit | +91 89375 04721 | standard |
| Rahul | +91 98765 43210 | placeholder (fake) |

### Groups
- **G1:** Harshit, Manan, Bitu
- **G2:** Kush, Krit, Bitu
- Bitu in both — intentional, sets up the demo's group-conflict catch.

### Group conflict rule (very specific)
If any group member books sport X at time T, no other group member can book sport X (any court) within **±2 hours of T** (start time only). Different sports unaffected. Different days unaffected.

### Demo seed bookings (in `config.json`)
- **Seed #1:** Hudle external booking, badminton tomorrow 8 PM (enables Hudle-conflict demo)
- **Seed #2:** Bitu's booking, badminton tomorrow 8 PM (enables group-conflict demo)
- **Seed #3:** disabled by default; toggle on for "all 3 courts booked → suggest different time" demo

### Customer-facing rules (all encoded in `system-prompt.md`)
- Never identify as AI unless asked
- English greeting first, switch to Hindi if caller does
- **Never mention specific court numbers** during a call
- All courts booked → suggest different time, **never different sport**
- Member-only slot when unavailable → just *"unavailable"*, NEVER *"members only"*
- Group conflict → just *"booked"*, NEVER mention groups or names
- External (Hudle/Khelomore) conflict → just *"booked"*, NEVER name the platform
- Never quote price to a member
- Non-member payment: ask Razorpay-link via WhatsApp OR pay at venue
- Amenity questions (parking/lockers/food/coaching) → graceful callback via `escalate_to_human`
- Always `check_availability` + `check_group` before `create_booking`
- Always summarize booking before confirming, wait for explicit yes

---

## The build sequence (Phase 1 — pre-launch prototype)

1. ✅ Marketing website (shipped)
2. ✅ Agent config + system prompt for Raheja Ileseum (user-approved v2)
3. ✅ **Twilio webhook handler** — `agent/server/` (Fastify + TS). `/voice/incoming` greets then opens a Media Stream. Twilio creds are placeholders in `.env.local` (KYC + auth pending).
4. ✅ **Sarvam STT integration** — `/voice/stream` WebSocket receives Twilio media (μ-law 8kHz), converts to PCM (`src/audio/mulaw.ts`), forwards to Sarvam streaming STT (`src/voice/sttBridge.ts`), logs transcripts. Auto-detect language for code-switching. Verified locally with a simulated media stream (frames received + counted; μ-law decode matches G.711 reference). **Needs `SARVAM_API_KEY` in `.env.local` to actually transcribe** — boots & counts frames without it.
5. ✅ **Sarvam LLM brain** — `src/brain/agent.ts` runs the Sarvam chat loop (`sarvam-105b`) with `system-prompt.md` as system message + the 6 tools (`src/brain/tools.ts`). Booking-rules engine `src/booking/engine.ts` implements availability, member-only windows + T-30 release, group ±2h conflict, court assignment — seeded from `config.json`. **14/14 rule checks pass** (deterministic, no key needed). Caller phone passed via Stream `<Parameter>` so tools can't be spoofed. **LIVE-VERIFIED** against the real Sarvam API: group-conflict scenario handled perfectly (offered alt time same sport, no leak). Key is in `.env.local`.
6. ✅ **Sarvam TTS** — `src/voice/ttsBridge.ts`. Brain reply → Sarvam streaming TTS (`bulbul:v2`, speaker `anushka`) configured to output **μ-law @ 8kHz directly** (Twilio's native format — zero conversion/resampling). Audio re-chunked to 160-byte frames and streamed back over the same WS as outbound `media`. Greeting moved from placeholder `<Say>` to TTS. **Verified end-to-end locally**: simulated Twilio call → greeting synthesized & 165 media frames (~3.3s) streamed back. Full loop (STT→brain→TTS) complete. Only the real phone leg is untested (needs Twilio number).
7. 🟡 **Supabase DB — capture layer DONE, read-path pending.** Schema `agent/server/db/schema.sql` (facilities, members, groups, group_members, bookings, call_logs, transcripts, tool_calls, audit_log; RLS enabled). DB client `src/db/client.ts`, persistence `src/db/persistence.ts` (call logs + transcripts + tool calls + audit — the LEARNING-LOOP capture layer), seed `src/db/seed.ts` (`npm run db:seed`). Wired into the agent (startSession/endSession, per-turn transcript + tool-call logging). **Graceful: no creds → in-memory seed, demo still works.** STILL TODO: swap the BookingEngine READ path (members/availability) from config.json to Supabase so bookings persist across calls; per-facility RLS policies (with Step 10 dashboard auth). Needs user's SUPABASE_URL + SERVICE_KEY.
8. ✅ **5 privacy rules** — audio never persisted (stream-through only); transcripts 90-day TTL + `purgeExpiredTranscripts` (boot + daily, `src/db/persistence.ts`); audit_log wired (call_started, deletes, purges); per-facility isolation (facility_id + RLS); right-to-delete via `delete_my_data` tool (`deleteCallerData`) + `deleteFacilityData()` ready for the dashboard. Verified delete flow + audit entries live.
9. ✅ **WhatsApp confirmation + Razorpay link** — `src/notify/` (whatsapp.ts, razorpay.ts, confirmation.ts). After a confirmed `create_booking`, the server fires a fire-and-forget WhatsApp confirmation (THE only place the court number appears — never spoken). `send_payment_link` now creates a real Razorpay Payment Link and delivers it over WhatsApp. Graceful: no `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_ID` → message is LOGGED not sent; no Razorpay keys → placeholder link. `engine.createBooking` now returns `amount` (members ₹0; non-members rate×hours, basketball full/half). Smoke-verified (₹600 badminton, ₹0 member tennis, ₹800 basketball half). Needs from user (NOT blocking): Meta WhatsApp token + phone-number-id (sandbox OK) and Razorpay test keys → paste into `.env.local`.
10. 🟡 **IN PROGRESS** — Facility owner dashboard. Visual direction = **Hybrid** (dark live rail + light paper), chosen from 3 rendered mockups (`scripts/mockups/`). Lives in the Next app under `/dashboard` (nested layout, brand tokens; custom-cursor + Lenis disabled there via `usePathname`). **All pages BUILT on seed data:** Overview, Calls list, Call detail (transcript bubbles + tool-call trace + booking card w/ court + privacy delete), Bookings (upcoming/recent), Members (+ groups), Settings (facility/integrations/pricing/privacy). Data layer = `src/lib/dashboard/{data,format,live,db}.ts`. **10.2 PARTIALLY DONE:** `getCalls/getCall/getBookings/getMembers` now read live Supabase (`live.ts`) with seed fallback; `getOverview`+`getSettings` still seed-only. Added **Test Mello page** (`/dashboard/test`) — chat/mic → proxy (`/api/test/[action]`) → agent server's real `/test/*` (CallAgent) → persists to DB + fires WhatsApp. Both web + agent **typecheck clean**, all routes 200. Components in `src/components/dashboard/`. STILL TODO: finish 10.2 (overview/settings live), then (10.3) Supabase magic-link auth + per-facility RLS. Order locked by user: pages → Supabase → auth. **See `TESTING_NOTES.md`** for the full end-to-end test guide + the list of known rough edges.
11. ⏳ **Per-facility learning loop** (uses Step 7's captured transcripts/tool_calls/outcomes). NOT live model training — it's: (a) prompt/example refinement from real call patterns, (b) per-facility memory (common requests, demand times, dialect quirks) fed as context, (c) optional fine-tuning ONLY if Sarvam supports it. Privacy: this-facility scope, audited, 90-day transcript TTL. See decision #3 + #12.

### Tool functions (IMPLEMENTED — `src/brain/tools.ts`, run by `dispatchTool`)
- `verify_member(phone)` → `{ is_member, name?, tier? }`
- `check_slot(sport, date, start_time, duration_minutes?, basketball_mode?)` → `{ available, alternative_times, reason? }` — **ONE combined call** (availability + member-window + T-30 + external + group conflict). Replaced the old separate check_availability + check_group (latency win). `reason` ∈ closed/past/too_far_ahead/unknown_sport (public, explainable); absent = "booked" (private).
- `create_booking({name, phone, sport, date, start_time, duration_minutes?, basketball_mode?})` → `{ booking_id, status }` (court is HIDDEN from the model — only in WhatsApp). Persists to Supabase.
- `delete_my_data()` → `{ deleted }` — caller right-to-delete.
- `send_payment_link(phone, amount, booking_id)` → `{ link_sent }` — ✅ Step 9: real Razorpay link delivered over WhatsApp (graceful without keys).
- `escalate_to_human(reason, callback_phone)` → `{ scheduled }` — **STILL A STUB** (wire when dashboard/notifications exist).

### Hosting plan (DECIDED)
- **Demo stage = laptop + ngrok (free).** Run `agent/server` locally, expose with
  `ngrok http 8080`, point Twilio's webhook at the ngrok URL. Full real-time
  capability, zero hosting bill. Use this for the client demo.
- **After demo succeeds → Railway** (~₹400/mo, always-on). Same server, no rewrite.
- **Vercel is OFF the table for the voice backend** — confirmed again with user.
  Serverless can't hold the persistent WebSocket needed for real-time Sarvam
  STT/TTS streaming (Steps 4–6). Vercel stays for the marketing site only.
- DB: **Supabase** (Postgres + auth + row-level security — good for per-facility isolation)

---

## How the user likes to work

- **Announce before each step.** They asked: *"tell me what you are building at that moment before you start so I can keep a track."* Always preface implementation with a short "I'm about to do X — here's why".
- **Present choices clearly so they can pick.** Use tables, numbered options, brief explanations. Avoid open-ended questions when a 3-option pick would work.
- **No walls of text.** They scan. Use headings, bullets, tables.
- **They're non-technical but smart.** Don't dumb down — explain unfamiliar things briefly the first time, then assume comprehension.
- **They sometimes paste screenshots with concerns.** Look carefully — they're usually right about something being broken/wrong.
- **They write lowercase casually.** Don't mistake this for low effort.
- **They use the AskUserQuestion pattern well.** Use it when you genuinely need a decision, not for trivial things.

---

## Known gotchas / dev environment quirks

- **OneDrive sync** makes file watching flaky. Sometimes `.next/` cache gets corrupted across rebuilds — delete it: `Remove-Item -Recurse -Force .next`
- **Multiple node processes** can pile up holding port 3000. Kill: `Get-Process node | Stop-Process -Force`
- **Dev server cold-start** can take 30-60s on first request due to OneDrive paths. Warm it up with a request before screenshotting.
- **PowerShell on Windows** is the shell. Pipeline chain `&&` / `||` are NOT available. Use `; if ($?) { ... }`. Don't use Unix `head` / `tail` — use `Select-Object -First N` / `-Last N`.
- **Headless screenshots:** use `scripts/shot.mjs` with env vars:
  ```
  URL=http://localhost:3000/  W=1440  H=900  FULL=1  REDUCED=1  OUT=scripts/shots/x.png  node scripts/shot.mjs
  ```
  `REDUCED=1` emulates `prefers-reduced-motion: reduce` so animations are skipped and everything renders statically (best for screenshots). Set `REDUCED=0` to capture motion mode.
- **For motion screenshots that need scroll**, use `scripts/shotmotion.mjs` (not committed — re-create if needed; uses puppeteer `page.mouse.wheel`).
- **GSAP + CSS transform pre-hides DON'T MIX.** Use `opacity: 0` for FOUC guards on elements GSAP will animate via `transform`. Mixing them stacks transforms → element stays stuck offscreen. (Cost us 1 hour to debug — see commit `11d7994`.)
- **Hydration**: `WaveBars` uses `.toFixed(2)` on its computed widths because `Math.sin` differs at last-ULP between Node and browser, which caused React hydration warnings.

---

## Git workflow

```powershell
git add -A
git commit -m "describe the change"
git push origin main   # triggers Vercel deploy
```

Vercel deploys in ~1-2 min. Hard refresh (`Ctrl+Shift+R`) to bypass browser cache.

`.gitignore` excludes: `/.next/`, `/scripts/shots/`, `/scripts/*.log`, `/public/logos/`, ad-hoc dev scripts, `.claude/settings.local.json`.

---

## ⛔ Things explicitly NOT to do

- ❌ Don't recommend Tailwind v4 / `@theme inline` syntax
- ❌ Don't suggest E2E encryption for customer data (we picked Trusted Processor)
- ❌ Don't suggest a custom build per client (multi-tenant only)
- ❌ Don't suggest abstract brushstroke / painterly logos
- ❌ Don't suggest M-monogram logos
- ❌ Don't suggest sound-wave / equalizer logos
- ❌ Don't try Claude Code's `preview_screenshot` (use `scripts/shot.mjs`)
- ❌ Don't invoke 21st.dev Magic MCP for components (it fails — hand-build instead)
- ❌ Don't suggest Vercel for the long-running voice agent backend (use Railway / Render)
- ❌ Don't have Mello say court numbers during calls
- ❌ Don't have Mello suggest a different sport when one is booked
- ❌ Don't have Mello explain WHY a slot is unavailable (members-only / group / external) — just "booked"
- ❌ Don't add the spec PDF / scaffold's default `next.svg` / `vercel.svg` back into `public/`

---

## Immediate next step (when user resumes)

**Finish Step 10.2 (live data for Overview + Settings), then Step 10.3 (auth).**
Order locked by user: pages → Supabase → auth. See the full state below.

### Step 10 — facility dashboard (IN PROGRESS) 🟡
- **Visual direction = "Hybrid"** (dark live rail + light paper), chosen from 3
  rendered mockups (`scripts/mockups/`). Lives in the Next app under `/dashboard`
  (nested layout, brand tokens; custom-cursor + Lenis disabled there).
- **All pages BUILT** (seed-backed, some live): Overview, Calls list, Call detail
  (transcript bubbles + tool-call trace + booking card w/ court + privacy delete),
  Bookings, Members, Settings, **Test Mello**.
- **Live Supabase read-path (10.2) — PARTIAL:** `getCalls/getCall/getBookings/
  getMembers` read real rows (`src/lib/dashboard/live.ts` + `db.ts`) with seed
  fallback. **STILL SEED:** `getOverview` (stats + live rail) + `getSettings`.
- **Test Mello** (`/dashboard/test`) — chat **or** mic (browser speech-to-text),
  her voice played back. Proxies (`/api/test/[action]`) to the agent server's
  real `/test/*` (CallAgent), so turns persist to Supabase + a booking fires the
  WhatsApp confirmation. **Text-first**: shows her reply (~2s) then plays voice in
  the background via a new `/test/speak` endpoint; has a 🔊/🔇 voice toggle.
- **STILL TODO:** 10.2 leftover (Overview + Settings live), then **10.3 auth**
  (Supabase magic-link + per-facility RLS — REQUIRED before the dashboard is
  public; it's currently open).

### Latency — tuned this session
- The bottleneck was **non-streaming TTS in the test console** (~2.3s), NOT the
  brain (~2s/turn at `medium`). The greeting (zero LLM) was ~5s = pure TTS.
- Fix: **text-first console** (reply shows in ~2s, voice loads in background) +
  mute toggle. Real phone path was already fast (streaming TTS ~0.3s + filler).
- `SARVAM_REASONING_EFFORT` stays **medium**: `low` wasn't faster (TTS-bound) and
  skipped the confirm-before-book step. (Tested A/B.)
- Sarvam free tier intermittently times out under rapid load (~60s) — transient.
  Future win: stream LLM tokens → TTS sentence-by-sentence (bigger change).

### Concurrency — verified + hardened this session
- **The agent handles concurrent calls.** `handleTwilioStream` gives every call
  its own isolated scope (own CallAgent, history, engine, WS). No shared mutable
  state. Node serves many I/O-bound calls on one instance. Verified live: 3
  simultaneous test sessions stayed fully separate.
- **Double-booking race FIXED:** `saveBooking` now (1) pre-checks the exact
  court/date/start and (2) relies on a DB UNIQUE index as the airtight backstop;
  on conflict, `dispatchTool` rolls back the in-memory booking (`engine.
  removeBooking`) and returns `unavailable` so Mello offers another time. Verified
  deterministically (1st save `saved`, 2nd same-slot `conflict`).
- ⚠️ **ACTION REQUIRED:** run `agent/server/db/migrations/001_booking_slot_unique.sql`
  in the Supabase SQL editor to activate the DB-level backstop (the app pre-check
  works without it; the index is the exact-simultaneous guarantee).
- Real ceiling at scale = **Sarvam paid tier** (free throttles concurrency).

### WhatsApp — tested LIVE this session ✅
- Sandbox token + phone-number-id added; **delivery confirmed** (template + a
  free-form confirmation both arrived on +91 83698 51507).
- ⚠️ Two gotchas: the sandbox **token expires ~24h** (grab a fresh one from Meta
  API Setup when it 401s with code 190); and free-form messages only deliver
  inside the **24h window** (message the test number first). **Production needs a
  pre-approved utility template** — switch `sendBookingConfirmation` to a template.

### Step 9 — DONE ✅
WhatsApp confirmation (Meta Cloud API) + Razorpay payment link. Built the same
graceful way as everything else (works with stubs, goes live when creds added):
- `src/notify/whatsapp.ts` — `sendWhatsApp(log, toPhone, message)` via Meta Cloud
  API (POST graph.facebook.com). No `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_ID` → LOGS
  the message instead of sending. Never throws.
- `src/notify/razorpay.ts` — `createPaymentLink(log, {amountInr, bookingId, phone})`
  hits the Payment Links API (amount ×100 → paise, `expire_by` from
  `RAZORPAY_LINK_VALIDITY_MINUTES`). No keys → placeholder `rzp.io/i/demo-<id>` link.
- `src/notify/confirmation.ts` — `buildConfirmationText()` (THE only place the
  court number surfaces), `sendBookingConfirmation()`, `sendPaymentLink()`. Nice
  formatting: "Today/Tomorrow/Mon, 12 Jun" + "7–8 PM". Members get no price line.
- `engine.createBooking` now returns `amount` via a private `priceFor()` helper
  (members ₹0; non-members rate×hours; basketball full/half rates).
- Wired in `dispatchTool`: after a confirmed `create_booking`, fire-and-forget
  `sendBookingConfirmation(...)` SERVER-SIDE (court stays out of speech).
  `send_payment_link` → Razorpay link → WhatsApp (phone from call ctx, not the
  model — unspoofable).
- New env vars: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_API_VERSION`
  (default v21.0), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `RAZORPAY_LINK_VALIDITY_MINUTES`. Flags: `whatsappConfigured`, `razorpayConfigured`.
- Verified: `tsc --noEmit` clean + smoke test (₹600 badminton, ₹0 member tennis,
  ₹800 basketball half; court only in WhatsApp text).

Needs from user to go LIVE (NOT blocking — it logs/placeholders without them):
Meta WhatsApp app (token + phone-number-id; sandbox is fine) and Razorpay test
keys → paste into `agent/server/.env.local`.

### What's already wired vs stubbed (so you don't redo it)
- ✅ Persistence (call_logs, transcripts, tool_calls, bookings, audit_log) — live in Supabase.
- ✅ `delete_my_data`, transcript purge, audit logging.
- ✅ `send_payment_link` = real Razorpay link over WhatsApp (Step 9; graceful without creds).
- ✅ WhatsApp booking confirmation fires server-side after `create_booking` (Step 9).
- 🔌 `escalate_to_human` = stub returning `{scheduled:true}` → wire when dashboard/notifications exist (Step 10).

### Test console + latency + voices (added after Step 6)
- **Browser test console** at `GET /test` (served by the agent server). Chat with
  Mello + hear her, no phone/Twilio needed. Runs the real brain+tools+engine;
  per-message voice dropdown. Files: `src/tester/page.ts`, `src/tester/synth.ts`
  (non-streaming TTS → WAV for browser). Routes in `index.ts`.
- **Voice = bulbul:v3 `ritu`** (env `SARVAM_TTS_SPEAKER`, default ritu) on BOTH
  live calls and the test console. We switched the live path from v2 *streaming*
  to **v3 non-streaming** (`textToSpeech.convert`, output_audio_codec mulaw @
  8000) because v2 voices sounded robotic/mispronounced English (dropped letters);
  v3 is much cleaner. Cost: ~1.5s reply-gen vs ~0.3s streaming → masked by a
  PRE-CACHED filler (`warmFillers` at boot). Good v3 voices: ritu/priya (F),
  rohan/amit (M); others can sound robotic so the console dropdown is curated.
  User picked **ritu** and wants it on the real product, not just demo. ✅
  NOTE: v3 streaming isn't supported by the SDK, hence non-streaming.
- **Measured latency (server-side, brain→voice):** TTS time-to-first-audio ~0.28s
  (excellent). Brain: ~0.8–1.5s simple turns; ~4–5s on turns needing
  availability+group tool hops (multi-round-trip). Add STT endpointing (~0.5–1s)
  + network (~0.3–0.6s) → end-to-end perceived ~2–3.5s simple, ~6–7s booking-logic
  turns. **105B + reasoning=medium chosen** (30B was slower AND ignored the
  persona; reasoning=low flubbed the conflict turn). Both tunable via env.
- **Latency roadmap (not done):** (a) speak a short filler ("ek sec…") while tools
  run; (b) combine check_availability+check_group into ONE tool to halve hops on
  the slow path; (c) stream LLM tokens to TTS sentence-by-sentence. Do these if
  the demo feels sluggish.

### Demo readiness note
The agent is fully functional NOW via laptop + ngrok — the ONLY blocker to a live
phone demo is a **Twilio number** (KYC pending; a temp US number works). Once a
number exists: `ngrok http 8080`, point the number's voice webhook at
`https://<ngrok>/voice/incoming`, and call it. STT on real speech + Twilio
playing the audio are the only things not yet exercised (no real call made yet).

### Still pending from the user (not blocking the build)
- **Twilio credentials** — Account SID + Auth Token (KYC + auth still pending). Paste into `agent/server/.env.local` when ready.
- **Phone number** — Indian KYC not cleared. For the demo, a temp US number (~$1/mo, no KYC) works; swap later.
- **Sarvam API key** — ✅ **ADDED** to `agent/server/.env.local` (free tier). Powers STT, the LLM brain, and TTS. NOTE: env loads `.env.local` first then `.env` (see `src/env.ts`) — `dotenv/config` alone would've missed it. Brain was **live-verified** end-to-end: Manan→7PM badminton→group conflict caught→offered 5PM same sport, code-switched to Hindi, never leaked the group/name. 🎉

### Decisions locked this session
- Backend = TypeScript on Node (Fastify). ✅
- Hosting = laptop + ngrok for the demo (free), Railway after. Vercel NOT for voice. ✅
- STT = Sarvam streaming (`speechToTextStreaming`, auto-detect language) to keep code-switching. NOT the translate resource. ✅
- LLM brain = Sarvam chat API (`sarvam-105b`), NOT OpenAI. One vendor, India-resident, tool-calling confirmed. ✅

---

## Files to read first (priority order)

1. **`HANDOFF.md`** (this file)
2. **`agent/facilities/raheja-ileseum/system-prompt.md`** (the agent's behavior)
3. **`agent/facilities/raheja-ileseum/config.json`** (the facility data)
4. **`src/lib/site.ts`** (constants)
5. **`BUILD_PROMPT.md`** (original brief — only if marketing-related question)

That should give you full context in <5 minutes. Now ask the user what they want to do, or proceed with the next step above if they say "continue."

---

*Last updated: end of session that built the marketing site, deployed to Vercel, and created the agent config + system prompt v2.*
