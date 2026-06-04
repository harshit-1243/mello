# mello.ai — marketing site

The AI receptionist for sports facilities. A single-page, production-ready
marketing site: a 24/7 voice agent that answers every call in Hindi + English,
checks live availability, and confirms the booking before the caller hangs up.

Built as a **calm, premium, cinematic** experience — a light editorial "paper"
base punctuated by dark "stage" sections, oversized editorial type, and
purposeful GSAP motion that dramatises the product rather than decorating it.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v3** — design tokens in `tailwind.config.ts` + `globals.css`
- **GSAP** + **ScrollTrigger** — the hero scrollytelling, split-text reveals, parallax
- **Lenis** — smooth scroll (drives ScrollTrigger)
- **Geist** (display) · **Inter** (body) · **JetBrains Mono** (system/real-time) via `next/font`

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
```

## Configure before launch — `src/lib/site.ts`

Replace these placeholders:

| Constant | What it is |
|---|---|
| `CALENDLY_URL` | The link every **Book a Demo** CTA opens (new tab). **TODO** |
| `CONTACT_EMAIL` | Footer + contact mailto. Currently `hello@mello.ai`. **TODO** |
| `social.linkedin / twitter / instagram` | Footer social links. **TODO** |

Everything else (copy, pricing, testimonials) is final per the brief. The
social-proof quotes are deliberately anonymised pilots — swap in named case
studies in `src/components/sections/SocialProof.tsx` when available.

## The signature hero — "The Call" (`src/components/sections/Hero.tsx`)

A scroll-scrubbed opening that dramatises a missed after-hours call being
answered and booked in seconds, told through the voice-waveform motif.

- **Desktop:** the section pins and the GSAP timeline scrubs to scroll
  (`end: "+=150%"`), then settles into the real headline + CTA.
- **Mobile (<768px):** no pin — the sequence auto-advances on scroll into view
  (IntersectionObserver) with tap-to-replay.
- **`prefers-reduced-motion`:** the scrub is skipped entirely and the final
  composed frame renders immediately (idle waveform + transcript + booking card
  + WhatsApp confirm + headline). Nothing essential is hidden behind motion.

## Motion system

- `LenisProvider` wires Lenis → `gsap.ticker` → `ScrollTrigger.update`.
- `Reveal` / `SplitReveal` — FOUC-free entrance + word-mask heading reveals. An
  inline `<head>` script adds `.anim` to `<html>` only when JS is on **and**
  reduced-motion is off, pre-hiding animated elements before first paint.
- `CustomCursor` (difference-blended, desktop fine-pointer only), `Magnetic`
  CTAs, `Parallax`, and a kinetic `Marquee`.
- Everything animates `transform`/`opacity` only (no layout thrash / CLS), and
  every motion path checks `prefersReducedMotion()`.

## Accessibility & performance

- Semantic landmarks, visible focus rings, AA contrast, labelled icons.
- The call demo has an `sr-only` text alternative; decorative layers are `aria-hidden`.
- `min-h-dvh`, no horizontal scroll, ≥44px touch targets, tabular figures for numbers.
- `next/font` with `display: swap`; no raster images (all visuals are vector/CSS).

## Deploy to Vercel

1. Push to a Git repo and import it at [vercel.com/new](https://vercel.com/new).
2. Framework preset **Next.js** — no extra config needed.
3. (Optional) Add Vercel Analytics (privacy-friendly, no cookie banner).

## Dev-only screenshot helpers

For visual QA in headless Chrome (`scripts/shot.mjs`, uses `puppeteer-core`):

```bash
# fully-composed static render (reduced-motion emulated)
URL=http://localhost:3000/ W=1440 FULL=1 OUT=scripts/shots/home.png node scripts/shot.mjs
```

Two query params are honoured **in development only** (guarded by `NODE_ENV`,
dead code in production): `?motion=off` forces the static path, `?lenis=off`
disables smooth scroll for crisp positioning.

## Project structure

```
src/
  app/                 layout, page, globals.css, icon.svg
  components/
    sections/          Nav, Hero, MarqueeBand, Problem, Statement, Pillars,
                       HowItWorks, Moat, SocialProof, Pricing, ClosingCTA, Footer
    ui/                Button, Magnetic, Pill, Eyebrow, Wordmark, WaveBars,
                       SplitReveal, Reveal, Parallax, Marquee, CustomCursor,
                       PricingCard, Container, icons
    providers/         LenisProvider
  lib/                 site (constants), gsap, smooth-scroll, cn
```

© 2026 mello.ai · Built in Mumbai.
