# BUILD PROMPT — mello.ai marketing website

You are building a **complete, production-ready, single-page marketing website** for **mello.ai**. Work autonomously and finish the whole site. **No lorem ipsum** — all copy you need is in this document. **No stock photos.** This file is the single source of truth.

**Project directory:** `C:\Users\HARSHIT\OneDrive\Desktop\mello.ai` (currently empty — scaffold here).
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + GSAP (ScrollTrigger) + Lenis smooth scroll. Deploy target: Vercel.

---

## 0) Tooling — do this first

1. **Confirm the 21st.dev Magic MCP is live.** Run `/mcp`. If a server named `magic` shows **disconnected/failed** (npx-on-Windows is finicky), fix it: edit `C:\Users\HARSHIT\.claude.json` → `mcpServers.magic` to use `"command": "cmd", "args": ["/c","npx","-y","@21st-dev/magic@latest"]` (keep the existing `env.API_KEY`), then it'll connect. If it still won't connect, proceed by hand-building components — do **not** block the build on it.
2. **Use Magic MCP** to generate first-pass components (nav, buttons, badges, pricing cards, feature cards, footer), then **restyle them to the art direction below** so everything is cohesive. **Hand-build the hero call-demo and all GSAP scroll choreography** — that's the signature work, don't outsource it.
3. **Use the `ui-ux-pro-max` skill** (installed globally) as your UX/a11y/motion checklist. You may run its engine for guidance:
   `python "C:\Users\HARSHIT\.claude\skills\ui-ux-pro-max\scripts\search.py" "<query>" --domain ux` (domains: `ux`, `style`, `color`, `typography`, `landing`). Follow **this** art direction for cohesion; use the skill to validate, not to override.
4. When built, **run it and look at it** (use the run/preview tooling), screenshot at **375px and 1440px**, and iterate on polish until it matches the quality bar.

---

## 1) Company context (source of truth)

**mello.ai** is a B2B SaaS platform that replaces the human receptionist + manual booking system for **sports & recreational facilities** (turfs, gyms, court complexes, multi-sport centres). It answers every inbound call 24/7 with conversational AI and completes the booking in real time.

**The product = three integrated tools, one platform:**
- **Mello Voice** — 24/7 AI phone receptionist. Answers in the facility's name, understands **Hindi + English with mid-sentence code-switching**, collects booking details (name, phone, date, time, sport), checks **live availability** and offers alternatives, **verifies membership**, enforces **group/no-double-booking rules**, applies **privacy controls**, and **confirms verbally on the call** — in under 3 minutes. Target response latency < 600ms per turn (it feels instant).
- **Mello Book** — the booking rules engine + admin dashboard. Real-time availability per court/sport/slot, membership database with priority logic, group registry with cross-booking restrictions, privacy layer, admin override, **full call transcripts**, and analytics (calls answered, bookings completed, conversion rate).
- **Mello Chat** — WhatsApp bot. Sends a **confirmation within 30 seconds** of a completed call, handles reschedule/cancel/availability/FAQ on its own, and escalates only what needs a human.

**Core pain:** Facilities lose revenue to missed calls — staff are on the field, calls go to voicemail, customers book the next turf. A receptionist costs **₹15,000+/month** and still clocks out at night. A busy facility makes **₹3–4 lakh/month** from bookings and bleeds a slice of it daily.

**Market:** Launching India-first — Tier-1 cities, starting **Mumbai / Navi Mumbai**, expanding to Pune & Bengaluru. **Pricing in ₹.**

**The moat (and the global story):** Global voice bots (Bland, Retell, Synthflow, Air.ai) are **English-only, USD-priced, no India presence.** Indian callers code-switch Hindi/English in one breath. Mello is built for that — **and the same engine scales to any language, any market.** Position mello as **globally capable, India-launched** — not an India-only product.

---

## 2) Positioning & brand mood (read carefully — this is the spine)

- **Calm, confident, competent, premium.** Like a well-trained front-desk manager who never drops the ball. The product handles business-critical money — the brand must feel **trustworthy and precise**, never gimmicky.
- **Craft bar:** Linear, Intercom, Calendly, Vercel — and the execution polish of sites like elementis.co / msport-raptor.com. **Match their craft and restraint, not their loudness.** Motion is *purposeful* (it shows the product working), never decorative noise.
- **Hard avoids:** generic SaaS blue/purple · stock photos of smiling office workers · Webflow-template aesthetics · emoji used as UI icons · AI-buzzword overpromising · fabricated named testimonials or fake founder names · India-only visual clichés / Devanagari-as-decoration.
- **Tone of copy:** direct, confident, a little bold. Every line earns its place. Indian context where it matters (₹, Hindi example phrases inside the demo), but globally legible.

---

## 3) Art direction (decided — execute with craft; refine within the system, don't fight it)

**Layout philosophy:** A **light, editorial "paper" base** with **two or three intentional dark "stage" sections** (the hero call-demo and the closing CTA) for cinematic contrast. Most SaaS sites are all-light or all-dark; this light-with-dark-stages rhythm is the signature. Generous whitespace, strong type hierarchy, a confident grid (max-width ~1240px content, full-bleed stages).

**Color tokens (cool/warm neutrals + ONE green accent — never blue/purple). Wire these into Tailwind `theme.extend` + CSS variables:**

| Role | Hex | Use |
|---|---|---|
| `ink` | `#181A15` | primary text, dark UI |
| `ink-muted` | `#5C5F54` | secondary text |
| `paper` | `#F5F3EE` | page background (warm bone) |
| `paper-raised` | `#FBFAF7` | cards/surfaces on paper |
| `line` | `#E5E2D9` | borders/dividers (light) |
| `stage` | `#0D100C` | dark section bg (warm near-black, faint green undertone) |
| `stage-raised` | `#161A14` | cards on dark |
| `on-stage` | `#ECEFE8` | text on dark |
| `green` | `#0E7C45` | **primary brand / CTA / "available"** (deep, confident emerald) |
| `green-press` | `#0B6238` | CTA pressed/hover-deep |
| `signal` | `#36DD83` | **"live / answered / confirmed" pulses & glows** — used sparingly, sings on the dark stage |
| `on-green` | `#F4FFF8` | text on green |

Green = "go / available / confirmed," semantically perfect for a booking product. Use `signal` only for the live moments (ringing pulse, the "booked" flash, the WhatsApp check). Avoid pure `#000`/`#FFF`.

**Typography:** one clean modern sans as the spine, plus a mono for "system/real-time" credibility.
- **Display/headings:** Geist (via the `geist` package, zero-config with Next) — or General Sans if you want more character. Tight tracking, weights 500–700. Big, confident, editorial.
- **Body/UI:** Inter (`next/font/google`).
- **Mono:** JetBrains Mono (`next/font/google`) — for the live call transcript, latency/stat readouts, call logs. **Tabular figures everywhere numbers matter** (pricing, stats).
- Body 16px min (mobile), line-height 1.5–1.6, line length 60–75ch. Type scale ~ 13 / 14 / 16 / 18 / 22 / 30 / 44 / 64 / 84 (clamp for fluid display sizes).

**Surface system:** soft editorial shadows (low-spread, warm-tinted), border-radius 12–20px on cards, hairline `line` borders, subtle noise/grain on the paper base (very low opacity) for richness. On dark stages: faint radial `signal`/`green` glows, never neon overload.

**Motion system (GSAP + ScrollTrigger + Lenis):**
- Lenis for smooth scroll (sensible, not sluggish). GSAP for all reveals/choreography.
- Easing: `expo.out` / `cubic-bezier(0.16,1,0.3,1)`. Durations 150–600ms; exits ~60–70% of enters. Stagger list/grid reveals 30–50ms.
- Animate `transform`/`opacity` only (no layout thrash, no CLS). **Only the hero opening (§4) pins/scrubs** — everything else uses entrance reveals on scroll; nothing else hijacks the scroll.
- **`prefers-reduced-motion`: fully respected** — content readable instantly, animations reduced/disabled, the hero opening degrades to its static, complete final frame (see §4).

---

## 4) The hero = a scroll-driven cinematic opening — "The Call" (THE signature piece; invest the most here)

This is the **"very cool but *meaningful*" scroll animation** that opens the site. It is **not decoration** — it dramatizes mello's entire value in one pinned, scroll-scrubbed sequence: an after-hours call that *should* have been missed, instead answered and booked in seconds, told through mello's signature **voice-waveform** motif. It also satisfies the playbook's #1 non-negotiable ("a demo of the AI handling a real call") — delivered as scrollytelling rather than a video.

**Form:** a dark **stage** hero that **pins** and **scrubs to scroll** (GSAP timeline + ScrollTrigger `scrub: true, pin: true`, roughly `end: "+=140%"` — keep it tight, never a hostage-scroll), then **releases into the static hero** (headline + CTA). Calm and premium — **Linear/Vercel-grade restraint**: monochrome stage + one green `signal`, generous negative space, type does the work, no parallax pile-ups. The waveform is the through-line of the whole sequence (voice = the product).

**Beat-by-beat (scroll progress 0 → 1). "Baseline Turf" / "Rahul" are representative demo names:**
1. `0.00` — Near-dark stage, a single faint **flatline** across center. Mono timestamp **"11:47 PM · after hours."** A red **"Missed call"** chip begins to flicker — the thing every facility dreads.
2. `0.12` — Instead of rolling to voicemail, the flatline **catches the call**: it blooms into a live **waveform** as `signal`-green energy sweeps across it. Caption types in: *"Mello picks up."*
3. `0.25` — **Mello:** "Namaste! **Baseline Turf** — kya help chahiye?"
4. `0.40` — **Caller:** "Kal shaam 7 baje 5-a-side turf chahiye." (waveform reacts to the caller's voice — different amplitude/tone)
5. `0.55` — An **availability grid** resolves: 7 PM → red (taken), 8 PM → green (open). **Mello:** "7 PM is taken — **8 PM** open. Theek hai?"
6. `0.70` — **Caller:** "Haan, 8 baje." A **booking card** assembles field-by-field (name · sport · time) → snaps to confirmed (green check).
7. `0.82` — A **WhatsApp confirmation** slides up: "✅ **Confirmed — Baseline Turf · 5-a-side · Tomorrow, 8:00 PM.** Reply 1 to reschedule."
8. `0.92` — It condenses to a mono stat: **"Booked in 38 seconds · 11:47 PM · no staff awake."** The opening's red **"Missed call"** is shown crossed out → **"Booked."** (the payoff: missed becomes booked)
9. `1.00` — The scene **settles** into the real hero: headline + subhead + CTA, the waveform now a calm idle motif. Pin releases → normal scroll continues into §3 Problem.

**Guardrails / fallbacks (required, not optional):**
- **Mobile (<768px):** do **not** pin/scrub (janky on touch). Play "The Call" as a compact **auto-advancing** sequence when it scrolls into view (IntersectionObserver) with a tap-to-replay; shorten the beats.
- **`prefers-reduced-motion`:** skip the scrub entirely — render the **final composed frame** immediately (idle waveform + booking card + WhatsApp confirm + headline/CTA), transcript as static text. Nothing essential is hidden behind motion.
- Provide a subtle **"skip ↓ / replay"** affordance. Build the waveform as lightweight **SVG/Canvas bars** animated via transform/opacity only (no layout thrash, no CLS). Keep the pinned scroll distance modest so it never feels like a hostage scroll.

**Settle-state copy — Headline (primary):** **"Never lose a booking to a missed call."**
**Subhead:** "Mello is a 24/7 AI receptionist for sports facilities. It answers every call in Hindi and English, checks live availability, and confirms the booking before the caller hangs up."
**Primary CTA:** `Book a Demo` (→ Calendly). **Secondary (text/ghost):** "Replay the call ↑".
*(Alt headlines if needed: "Every call answered. Every booking captured." · "Your front desk, on every call. 24/7.")*

---

## 5) Sections (single page, in order) — with real copy

**1. Nav (sticky):** wordmark **`mello`** (lowercase, custom-set; a small `signal` dot or audio-wave glyph as the icon). Anchor links: Product · How it works · Pricing. Right: `Book a Demo`. Subtle glass/blur + hairline border appears on scroll. Mobile: clean sheet menu.

**2. Hero** — section 4 above.

**3. Problem.** Heading: **"Every missed call is a booking that didn't happen."** Body: "Your staff are on the field, not the phone. Calls roll to voicemail. The customer books the next turf instead. A full-time receptionist costs ₹15,000+ a month — and still clocks out at night. A busy facility makes ₹3–4 lakh a month from bookings, and loses a slice of it every single day to calls nobody picked up." Three stat/credibility chips: *"Peak-hour calls → voicemail"* · *"₹15K+/mo for a desk that sleeps"* · *"After-hours calls answered: 0 → ∞"*.

**4. Product pillars (Voice / Book / Chat)** — use-case framed, not feature dumps. Heading: **"Three tools. One platform. Zero missed calls."**
- **Mello Voice — "Answers like your best front-desk manager."** Greets in your facility's name, understands Hindi-English mid-sentence, checks live availability and offers alternatives, verifies membership, blocks double-bookings, and confirms on the call. Under 3 minutes, 24/7.
- **Mello Book — "The rules engine behind every booking."** Real-time availability across courts and slots, membership priority, group restrictions, privacy controls, full call transcripts, and an admin dashboard your manager actually understands. One source of truth for the whole facility.
- **Mello Chat — "Confirmed on WhatsApp before they've hung up."** A confirmation within 30 seconds, reschedules / cancellations / FAQs handled automatically, and only the real exceptions escalated to your staff.

**5. How it works (3 steps).** Heading: **"Set it up once. Stop missing calls forever."**
1. **The phone rings.** 7 AM or 2 AM, peak hour or match time — Mello answers in your business's name.
2. **Mello books it.** Understands the request in Hindi or English, checks live availability, handles memberships and group rules, confirms the slot on the call.
3. **WhatsApp seals it.** A confirmation lands in 30 seconds. Reschedules and questions handle themselves. You wake up to bookings, not voicemails.

**6. The moat / "why Mello wins."** Dark **stage** band. Heading: **"Built for how India actually talks — ready for everywhere else."** Body: "Global voice bots speak English and bill in dollars. Indian callers switch between Hindi and English in the same breath — *'kal shaam 7 baje turf chahiye.'* Mello was built for that from day one. The same engine scales to any language and any market." Optional compact contrast row: *English-only bots · USD pricing · no Hindi* ✕ vs *Bilingual · ₹ pricing · built for India, ready to scale* ✓.

**7. Social proof (representative, honest — clearly anonymized pilots; no fabricated names/logos).** Heading: **"Quietly going live across Mumbai."**
- "A 6-court turf in Navi Mumbai now answers every after-hours call — and recovered **40+ bookings** in its first month." — *Operations lead, Navi Mumbai*
- "Zero missed calls since switching. Our staff finally stay on the field." — *Manager, multi-sport arena, Mumbai*
- Stat band (mono, tabular): **24/7** calls answered · **<600ms** response · **30 sec** to WhatsApp confirm · **Hindi + English** (and counting).
- Honest footnote: "Piloting now with facilities in Mumbai & Navi Mumbai." *(Replace with named case studies when available.)*

**8. Pricing (exact — featured middle).** Heading: **"Pricing that pays for itself in one recovered booking."** Monthly, INR, tabular figures.
- **Starter — ₹4,999/mo** — 500 voice minutes · 1 facility · Mello Book + Chat · email support. CTA `Book a Demo`.
- **Growth — ₹9,999/mo — ⭐ Most popular (FEATURED, lifted card, `green` border/accent)** — 1,500 voice minutes · up to 3 facilities · priority support · analytics. CTA `Book a Demo`.
- **Enterprise — Custom** — unlimited minutes · multi-location · dedicated account manager · SLAs. CTA `Talk to us`.
- Footnote: "Overage ₹8/min beyond your bundle · one-time onboarding ₹10,000–25,000 (setup, data migration & training) · no hidden fees."

**9. Closing CTA.** Dark **stage**, the cinematic sign-off. Heading: **"Never lose a booking to a missed call."** Sub: "See Mello answer a live call and book it — in under three minutes." Single button: `Book a Demo`. Subtle `signal` glow / a faint final waveform motif.

**10. Footer.** Wordmark + tagline **"The AI receptionist for sports facilities."** Columns — **Product:** Mello Voice, Mello Book, Mello Chat · **Company:** Pricing, About, Contact · **Legal:** Privacy, Terms. Contact: `hello@mello.ai` · Mumbai, India. Small line: "Built in Mumbai." · © 2026 mello.ai. *(No fabricated founder names.)*

---

## 6) Build & technical requirements

- **Scaffold:** `create-next-app` (TS, Tailwind, App Router, `src/`, import alias `@/*`). Install: `gsap`, `lenis`, `geist`. Fonts via `next/font` (Inter, JetBrains Mono) + `geist`.
- **Architecture:** componentized sections under `src/components/sections/*`, shared UI (`Button`, `Badge`, `PricingCard`, `Pill`, `WaveBars`) under `src/components/ui/*`. A `LenisProvider` + a small GSAP/ScrollTrigger registration util. Centralize tokens in `tailwind.config.ts` + `globals.css`.
- **Config constants** (one file, `src/lib/site.ts`, clearly marked TODOs to replace): `CALENDLY_URL` (the `Book a Demo` CTA opens this in a modal or new tab), `CONTACT_EMAIL`, social links. Optional: Plausible or Vercel Analytics (privacy-friendly, no cookie banner).
- **Responsive & mobile-first:** breakpoints 375 / 768 / 1024 / 1440. No horizontal scroll. `min-h-dvh` not `100vh`. Touch targets ≥44px.
- **Accessibility:** semantic landmarks, visible focus rings, contrast ≥4.5:1, the call-demo has an `aria-live` text alternative / can be paused, all interactive icons labelled, `prefers-reduced-motion` honored.
- **Performance:** `next/image` with width/height (no CLS), lazy-load below-fold, font-display swap, transform/opacity-only animations. Aim Lighthouse 90+.
- **README** with `npm run dev`, build, and Vercel deploy notes; list every TODO constant to fill in.

## 7) Definition of done
- All 10 sections present with the real copy above — zero lorem, zero stock photos.
- The hero **scroll-driven opening ("The Call", §4) works** — it pins, scrubs through the call→booking beats, then settles into headline + CTA; with the required **mobile (no-pin auto-play)** and **reduced-motion (static final frame)** fallbacks.
- Fully responsive (verified at 375 + 1440 with screenshots), smooth Lenis scroll, GSAP reveals, no console errors, no layout shift.
- `Book a Demo` is the single consistent CTA throughout, wired to `CALENDLY_URL`.
- Cohesive: green accent + paper/stage rhythm + type system applied consistently; matches the calm-premium craft bar.

**Build the whole thing, then run it, screenshot it, and polish until it's genuinely excellent. You have full creative authority to elevate within this system.**
