import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { Pill } from "@/components/ui/Pill";
import { Reveal } from "@/components/ui/Reveal";
import { HeroCall } from "@/components/ui/HeroCall";
import { SITE } from "@/lib/site";

/**
 * Hero — the living, audio-reactive Voice Orb IS the hero. It's centered and
 * dominant; tap it to hear a real Mello call (Sarvam voice) with the transcript
 * playing as synced captions. Only a small eyebrow above and a concise line +
 * CTA below — the orb is the main thing.
 */
export function Hero() {
  return (
    <section
      id="top"
      data-nav="dark"
      className="is-stage relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden py-24 text-center text-on-stage"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 32%, #3a2065 0%, #241445 38%, #160d2b 70%, #0e0820 100%)",
      }}
    >
      {/* ambient glows + soft vignette */}
      <div
        aria-hidden
        className="glow-signal pointer-events-none absolute left-1/2 top-[30%] h-[55%] w-[58%] -translate-x-1/2 opacity-55"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 55% at 50% 50%, transparent 55%, rgba(8,4,18,0.55) 100%)" }}
      />

      <span className="sr-only">
        Mello, a 24/7 AI receptionist for sports facilities, answers a call for
        Baseline Turf, finds an open 8 PM slot, books it, and confirms on
        WhatsApp.
      </span>

      <Container className="relative flex flex-col items-center">
        <Reveal>
          <Pill tone="signal" live className="mb-9">
            24/7 · Always answering
          </Pill>
        </Reveal>

        {/* THE hero — the living orb */}
        <HeroCall size={500} />

        <Reveal
          as="h1"
          delay={0.05}
          className="mt-10 max-w-2xl text-[clamp(1.5rem,3vw,2.4rem)] font-semibold leading-tight tracking-tight text-on-stage text-balance"
        >
          Never lose a booking to a missed call.
        </Reveal>
        <Reveal delay={0.1} className="mt-7">
          <Magnetic strength={0.5}>
            <Button href={SITE.CALENDLY_URL} external size="lg">
              Book a Demo
            </Button>
          </Magnetic>
        </Reveal>
      </Container>
    </section>
  );
}
