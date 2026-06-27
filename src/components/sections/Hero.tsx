"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { scrollToId } from "@/lib/smooth-scroll";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { Pill } from "@/components/ui/Pill";
import { WaveBars } from "@/components/ui/WaveBars";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import {
  Clock,
  Check,
  MessageCheck,
  ArrowUp,
  ArrowDown,
  ArrowRight,
} from "@/components/ui/icons";

const TRANSCRIPT = [
  { who: "Mello", text: "Namaste! Baseline Turf — kya help chahiye?" },
  { who: "Caller", text: "Kal shaam 7 baje 5-a-side turf chahiye." },
  { who: "Mello", text: "7 PM is taken — 8 PM open. Theek hai?" },
  { who: "Caller", text: "Haan, 8 baje." },
];

const SLOTS = [
  { t: "6 PM", s: "open" },
  { t: "7 PM", s: "taken" },
  { t: "8 PM", s: "sel" },
  { t: "9 PM", s: "open" },
];

const BOOKING = [
  { k: "Name", v: "Rahul" },
  { k: "Sport", v: "5-a-side" },
  { k: "Time", v: "Tomorrow, 8:00 PM" },
];

type GsapTimeline = ReturnType<typeof gsap.timeline>;

export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const mobileTl = useRef<GsapTimeline | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const q = gsap.utils.selector(el);

    const setInitial = () => {
      gsap.set(q("[data-call='context']"), { autoAlpha: 1, y: 0 });
      gsap.set(q("[data-call='headline']"), { autoAlpha: 0, y: 24 });
      gsap.set(q("[data-call='line']"), { autoAlpha: 0, y: 10 });
      gsap.set(q("[data-call='caption']"), { autoAlpha: 0, y: 8 });
      gsap.set(q("[data-call='grid']"), { autoAlpha: 0, y: 10 });
      gsap.set(q("[data-slot]"), { autoAlpha: 0, scale: 0.8 });
      gsap.set(q("[data-call='booking']"), { autoAlpha: 0, y: 14 });
      gsap.set(q("[data-bk-row]"), { autoAlpha: 0, x: -8 });
      gsap.set(q("[data-bk-confirm]"), { autoAlpha: 0, scale: 0.5 });
      gsap.set(q("[data-call='wa']"), { autoAlpha: 0, y: 16 });
      gsap.set(q("[data-call='stat']"), { autoAlpha: 0, y: 8 });
      gsap.set(q("[data-call='booked']"), { autoAlpha: 0, x: -6 });
      gsap.set(q("[data-strike]"), { scaleX: 0, transformOrigin: "left center" });
    };

    const wave = q("[data-call='wave']")[0] as HTMLElement | undefined;
    const amp = { v: 0.05 };
    const applyAmp = () => wave?.style.setProperty("--amp", String(amp.v));

    const build = (tl: GsapTimeline) => {
      const L = q("[data-call='line']");
      applyAmp();
      tl
        // beat 1 → 2: the flatline catches the call, blooms into a waveform
        .to(q("[data-call='hint']"), { autoAlpha: 0, duration: 0.3 }, 0.05)
        .to(amp, { v: 1, duration: 0.7, ease: "expo.out", onUpdate: applyAmp }, 0.2)
        .to(q("[data-call='caption']"), { autoAlpha: 1, y: 0, duration: 0.35 }, 0.35)
        .to(q("[data-call='caption']"), { autoAlpha: 0, duration: 0.35 }, 1.15)
        // beat 3: Mello greets
        .to(L[0], { autoAlpha: 1, y: 0, duration: 0.4 }, 1.05)
        // beat 4: caller speaks, waveform reacts
        .to(amp, { v: 0.82, duration: 0.45, onUpdate: applyAmp }, 1.55)
        .to(L[1], { autoAlpha: 1, y: 0, duration: 0.4 }, 1.6)
        // beat 5: availability grid resolves
        .to(q("[data-call='grid']"), { autoAlpha: 1, y: 0, duration: 0.4 }, 2.2)
        .to(q("[data-slot]"), { autoAlpha: 1, scale: 1, stagger: 0.07, duration: 0.3 }, 2.3)
        .to(L[2], { autoAlpha: 1, y: 0, duration: 0.4 }, 2.85)
        // beat 6: caller confirms, booking assembles field-by-field
        .to(amp, { v: 0.6, duration: 0.4, onUpdate: applyAmp }, 3.3)
        .to(L[3], { autoAlpha: 1, y: 0, duration: 0.35 }, 3.35)
        .to(q("[data-call='grid']"), { autoAlpha: 0, y: -8, duration: 0.35 }, 3.5)
        .to(q("[data-call='booking']"), { autoAlpha: 1, y: 0, duration: 0.4 }, 3.55)
        .to(q("[data-bk-row]"), { autoAlpha: 1, x: 0, stagger: 0.13, duration: 0.3 }, 3.7)
        .to(q("[data-bk-confirm]"), { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)" }, 4.2)
        // beat 7: WhatsApp confirmation slides up
        .to(q("[data-call='wa']"), { autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }, 4.55)
        // beat 8: condense to stat, missed → booked
        .to(q("[data-call='stat']"), { autoAlpha: 1, y: 0, duration: 0.4 }, 5.0)
        .to(q("[data-strike]"), { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, 5.1)
        .to(q("[data-call='missed']"), { opacity: 0.45, duration: 0.3 }, 5.2)
        .to(q("[data-call='booked']"), { autoAlpha: 1, x: 0, duration: 0.4 }, 5.3)
        // beat 9: settle into the real hero
        .to(amp, { v: 0.42, duration: 0.6, onUpdate: applyAmp }, 5.5)
        .to(q("[data-call='context']"), { autoAlpha: 0, y: -14, duration: 0.5 }, 5.6)
        .to(q("[data-call='headline']"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" }, 5.7);
    };

    const mm = gsap.matchMedia();

    // Desktop: pin + scrub
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        setInitial();
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });
        build(tl);
        return () => {
          wave?.style.removeProperty("--amp");
        };
      },
    );

    // Mobile: no pin — auto-advance when it scrolls into view, tap to replay
    mm.add(
      "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
      () => {
        setInitial();
        const tl = gsap.timeline({ paused: true });
        build(tl);
        mobileTl.current = tl;
        const io = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              tl.play();
              io.disconnect();
            }
          },
          { threshold: 0.35 },
        );
        io.observe(el);
        return () => {
          io.disconnect();
          mobileTl.current = null;
          wave?.style.removeProperty("--amp");
        };
      },
    );

    return () => mm.revert();
  }, []);

  const handleReplay = () => {
    if (mobileTl.current) {
      mobileTl.current.restart();
    } else {
      scrollToId("#top");
    }
  };

  return (
    <section
      id="top"
      ref={scope}
      data-nav="dark"
      className="is-stage relative isolate flex min-h-dvh items-center overflow-hidden bg-stage py-28 text-on-stage sm:py-32 lg:py-0"
    >
      {/* ambient glows */}
      <div
        aria-hidden
        className="glow-green pointer-events-none absolute right-[-10%] top-[10%] h-[60%] w-[55%] opacity-70"
      />
      <div
        aria-hidden
        className="glow-signal pointer-events-none absolute left-[-5%] bottom-[-10%] h-[50%] w-[45%] opacity-60"
      />

      <span className="sr-only">
        Demonstration: at 11:47 PM, after hours, Mello answers a call for
        Baseline Turf, checks availability, and books a 5-a-side turf for
        tomorrow at 8 PM, confirming on WhatsApp in 38 seconds.
      </span>

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.04fr] lg:gap-14">
          {/* LEFT — context (during the call) crossfades into the headline */}
          <div className="relative order-2 grid lg:order-1 [&>*]:col-start-1 [&>*]:row-start-1">
            {/* transient context, desktop only */}
            <div
              data-call="context"
              className="hidden self-center opacity-0 lg:block"
            >
              <div className="flex items-center gap-2 font-mono text-sm text-on-stage/55">
                <Clock className="h-4 w-4" />
                <span>11:47 PM · after hours</span>
              </div>
              <p className="mt-6 max-w-[15ch] font-display text-[clamp(2rem,3.4vw,3rem)] font-semibold leading-[1.05] tracking-tight text-on-stage/90 text-balance">
                A call that should have been missed.
              </p>
              {/* missed → booked payoff */}
              <div className="mt-7 flex items-center gap-3">
                <span
                  data-call="missed"
                  className="relative inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger/[0.08] px-3 py-1 text-[0.82rem] font-medium text-danger"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  Missed call
                  <span
                    data-strike
                    className="absolute left-2 right-2 top-1/2 h-px bg-danger"
                  />
                </span>
                <ArrowRight
                  data-call="booked"
                  className="h-4 w-4 text-on-stage/40"
                />
                <span
                  data-call="booked"
                  className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-[0.82rem] font-semibold text-signal"
                >
                  <Check className="h-3.5 w-3.5" />
                  Booked
                </span>
              </div>
            </div>

            {/* settle-state headline */}
            <div data-call="headline" data-hero-hide className="self-center">
              <Pill tone="signal" live className="mb-6">
                24/7 · Hindi + English
              </Pill>
              <h1 className="text-display-lg font-semibold text-on-stage text-balance">
                Never lose a booking to a missed call.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-stage/70">
                Mello is a 24/7 AI receptionist for sports facilities. It answers
                every call in Hindi and English, checks live availability, and
                confirms the booking before the caller hangs up.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Magnetic strength={0.5}>
                  <Button href={SITE.CALENDLY_URL} external size="lg">
                    Book a Demo
                  </Button>
                </Magnetic>
                <button
                  type="button"
                  onClick={handleReplay}
                  className="group inline-flex h-[52px] items-center gap-2 rounded-full px-5 text-[1.02rem] font-medium text-on-stage/75 transition-colors hover:bg-white/[0.06] hover:text-on-stage"
                >
                  <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  Replay the call
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — the call panel */}
          <div className="order-1 lg:order-2">
            <CallPanel />
          </div>
        </div>
      </Container>

      {/* scroll hint */}
      <div
        data-call="hint"
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-1.5 text-on-stage/40 lg:flex"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.24em]">
          Scroll
        </span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}

function CallPanel() {
  return (
    <div className="relative mx-auto w-full max-w-md rounded-[26px] border border-white/10 bg-stage-raised p-4 shadow-soft-stage sm:p-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Pill tone="stage" live className="!px-2.5">
            Live call
          </Pill>
          <span className="font-mono text-[0.78rem] text-on-stage/55">
            Baseline Turf
          </span>
        </div>
        <span className="font-mono text-[0.78rem] text-on-stage/45 tabular">
          00:38
        </span>
      </div>

      {/* waveform */}
      <div className="mt-4 h-14 rounded-2xl bg-white/[0.02] px-3">
        <div data-call="wave" className="h-full">
          <WaveBars count={48} className="!gap-[3px]" />
        </div>
      </div>

      {/* transcript */}
      <div className="relative mt-4 space-y-2.5">
        {TRANSCRIPT.map((l, i) => {
          const isMello = l.who === "Mello";
          return (
            <div
              key={i}
              data-call="line"
              data-hero-hide
              className={cn(
                "flex items-end gap-2",
                isMello ? "" : "flex-row-reverse",
              )}
            >
              <span className="mb-1 font-mono text-[9px] uppercase tracking-wide text-on-stage/35">
                {l.who}
              </span>
              <p
                className={cn(
                  "max-w-[82%] rounded-2xl px-3 py-2 text-[0.84rem] leading-snug",
                  isMello
                    ? "rounded-bl-sm bg-white/[0.06] text-on-stage/90"
                    : "rounded-br-sm bg-signal/[0.14] text-on-stage",
                )}
              >
                {l.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* result area — grid morphs into booking */}
      <div className="relative mt-4 min-h-[148px]">
        {/* availability grid (transient) */}
        <div data-call="grid" className="absolute inset-0 opacity-0">
          <div className="font-mono text-[10px] uppercase tracking-wide text-on-stage/40">
            Checking availability…
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {SLOTS.map((sl) => (
              <div
                key={sl.t}
                data-slot
                className={cn(
                  "rounded-lg py-2.5 text-center font-mono text-[0.78rem] tabular",
                  sl.s === "taken" &&
                    "bg-danger/15 text-danger line-through decoration-danger/50",
                  sl.s === "sel" &&
                    "bg-signal text-stage font-semibold",
                  sl.s === "open" && "bg-white/[0.05] text-on-stage/70",
                )}
              >
                {sl.t}
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[0.74rem] text-on-stage/45">
            7 PM taken · 8 PM open
          </p>
        </div>

        {/* booking card */}
        <div
          data-call="booking"
          data-hero-hide
          className="absolute inset-0 rounded-2xl border border-white/10 bg-stage p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wide text-on-stage/40">
              Booking
            </span>
            <span
              data-bk-confirm
              className="inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-2 py-0.5 text-[0.74rem] font-semibold text-signal"
            >
              <Check className="h-3 w-3" />
              Confirmed
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {BOOKING.map((r) => (
              <div
                key={r.k}
                data-bk-row
                className="flex items-center justify-between border-b border-white/5 pb-2 text-[0.84rem] last:border-0"
              >
                <span className="font-mono text-[0.74rem] uppercase tracking-wide text-on-stage/40">
                  {r.k}
                </span>
                <span className="font-medium text-on-stage">{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* caption overlay */}
        <div
          data-call="caption"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0"
        >
          <span className="rounded-full border border-signal/20 bg-stage/85 px-4 py-2 font-display text-lg font-medium text-signal backdrop-blur-sm">
            Mello picks up.
          </span>
        </div>
      </div>

      {/* whatsapp confirmation */}
      <div
        data-call="wa"
        data-hero-hide
        className="mt-3 flex items-start gap-2.5 rounded-2xl border border-signal/20 bg-signal/[0.06] p-3"
      >
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-signal/15 text-signal">
          <MessageCheck className="h-4 w-4" />
        </span>
        <div className="text-[0.8rem] leading-snug">
          <p className="font-medium text-on-stage">
            Confirmed — Baseline Turf · 5-a-side · Tomorrow, 8:00 PM
          </p>
          <p className="text-on-stage/55">Reply 1 to reschedule.</p>
        </div>
      </div>

      {/* stat */}
      <p
        data-call="stat"
        data-hero-hide
        className="mt-3 text-center font-mono text-[0.74rem] text-on-stage/50 tabular"
      >
        Booked in 38 seconds · 11:47 PM · no staff awake
      </p>
    </div>
  );
}
