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

### Voice agent — design docs DONE, code NOT STARTED
Two documents written for the first demo facility:
- `agent/facilities/raheja-ileseum/config.json` — facility data
- `agent/facilities/raheja-ileseum/system-prompt.md` — Mello's brain
- Both have been **reviewed and approved by user** with all corrections applied (v2)

### Pending
- Voice agent code (Step 3 onwards — see "Next step")
- Logo (user prefers streetwear / Jordan Jumpman energy, NOT abstract painting NOT M-monogram)
- `/privacy` and `/security` pages on the marketing site (discussed, not built)
- Membership/dashboard for facility owners (Phase 2)

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
| Sarvam AI | ✅ signed up | for STT + TTS in Hindi/English |
| OpenAI | ✅ signed up | for the agent brain |
| Supabase | ❌ not yet | will be the database |
| Razorpay | ❌ not yet | for non-member payments (WhatsApp link) |
| Meta WhatsApp Business API | ❌ not yet | sandbox first, then prod approval |
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
3. ⏳ **NEXT — Twilio webhook handler** ("agent picks up the phone and says hello")
4. ⏳ Sarvam STT integration (transcribe caller audio)
5. ⏳ OpenAI brain wired to the system prompt + tool calls
6. ⏳ Sarvam TTS (speak back to caller)
7. ⏳ Supabase DB seeded from `config.json` (members, groups, bookings, audit log)
8. ⏳ 5 privacy rules baked in (60s audio destroy, 90d transcripts, audit log, per-facility isolation, delete-everything button)
9. ⏳ WhatsApp confirmation via Meta sandbox (Razorpay link or "pay at venue" message)
10. ⏳ Basic facility dashboard (login, see calls/transcripts/bookings, delete button)

### Tool functions the agent will call (defined in system prompt)
- `verify_member(phone)` → `{ is_member, name?, tier? }`
- `check_availability(sport, date, start, duration, is_member, current_time)` → `{ available, alternative_times }`
- `check_group(phone, sport, date, start)` → `{ conflict }`
- `create_booking({...})` → `{ booking_id, assigned_court, status }`
- `send_payment_link(phone, amount, booking_id)` → `{ link_sent }`
- `escalate_to_human(reason, callback_phone)` → `{ scheduled }`

### Recommended hosting (proposed but not committed)
- Voice agent backend: **Railway** (~₹400/mo, long-running Node server for Twilio webhooks)
- Marketing site: **Vercel** (already there)
- DB: **Supabase** (Postgres + auth + row-level security built in — good for per-facility isolation)

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

**Step 3: Twilio webhook handler.**

A small Node.js server (TypeScript) that:
1. Exposes a webhook URL Twilio calls when a phone number rings
2. Responds with TwiML that has the AI say *"Hello, can you hear me? This is Mello."*
3. Logs the call to the console
4. Hangs up

Goal: prove the phone-to-server path works before plugging in Sarvam STT/TTS.

### What to ask the user before writing code
1. **Twilio credentials** — Account SID + Auth Token. They're at `console.twilio.com` → Account → "Account SID" and "Auth Token" buttons. Tell them to copy both. (Treat as secrets — store in `.env.local`, never commit.)
2. **Phone number status** — did Indian KYC clear? If not, recommend buying a temporary US number (~$1/mo, no KYC) so we can build and demo. We swap to the Indian number once KYC clears.
3. **Backend language confirmation** — propose TypeScript on Node.js (their codebase is already TS). They haven't rejected this.
4. **Hosting confirmation** — propose Railway (~₹400/mo). They haven't picked yet.

Then announce: *"I'm about to write `agent/server/index.ts` — a Fastify (or Express) endpoint at `/voice/incoming` that returns TwiML reading a hello message."* And go.

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
