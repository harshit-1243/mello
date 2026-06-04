import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { WaveBars } from "@/components/ui/WaveBars";
import { SITE } from "@/lib/site";

export function ClosingCTA() {
  return (
    <section
      data-nav="dark"
      className="is-stage relative isolate z-10 -mt-6 overflow-hidden rounded-t-[1.75rem] bg-stage py-28 text-on-stage shadow-[0_-30px_70px_-40px_rgba(0,0,0,0.55)] sm:-mt-12 sm:rounded-t-[2.75rem] sm:py-36 lg:py-44"
    >
      {/* radial glows */}
      <div
        aria-hidden
        className="glow-green pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[70%] -translate-x-1/2 -translate-y-1/2 opacity-80"
      />
      <div
        aria-hidden
        className="glow-signal pointer-events-none absolute left-1/2 top-[20%] h-[50%] w-[55%] -translate-x-1/2"
      />

      <Container className="relative text-center">
        <Reveal className="flex justify-center">
          <Eyebrow onStage>Ready when they call</Eyebrow>
        </Reveal>
        <SplitReveal
          as="h2"
          text="Never lose a booking to a missed call."
          className="mx-auto mt-7 max-w-[15ch] text-display-lg text-on-stage text-balance"
        />
        <Reveal
          as="p"
          delay={0.1}
          className="mx-auto mt-7 max-w-xl text-xl leading-relaxed text-on-stage/70"
        >
          See Mello answer a live call and book it &mdash; in under three
          minutes.
        </Reveal>
        <Reveal delay={0.15} className="mt-11 flex justify-center">
          <Magnetic strength={0.5}>
            <Button href={SITE.CALENDLY_URL} external size="lg">
              Book a Demo
            </Button>
          </Magnetic>
        </Reveal>
      </Container>

      {/* faint idle waveform motif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-[0.22] [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
      >
        <WaveBars
          count={96}
          className="h-full"
          style={{ "--amp": 0.5 } as React.CSSProperties}
        />
      </div>
    </section>
  );
}
