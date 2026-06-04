import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { WaveBars } from "@/components/ui/WaveBars";

export function Statement() {
  return (
    <section
      data-nav="dark"
      className="is-stage relative isolate z-10 -mt-6 flex items-center overflow-hidden rounded-t-[1.75rem] bg-stage py-28 text-on-stage shadow-[0_-30px_70px_-40px_rgba(0,0,0,0.55)] sm:-mt-12 sm:rounded-t-[2.75rem] sm:py-32 lg:py-40"
    >
      {/* centered glow */}
      <div
        aria-hidden
        className="glow-green pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[72%] -translate-x-1/2 -translate-y-1/2 opacity-80"
      />

      <Container className="relative text-center">
        <div className="flex justify-center">
          <Eyebrow onStage>From missed to booked</Eyebrow>
        </div>

        <div className="relative mt-10">
          {/* waveform threaded directly behind the headline */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 opacity-[0.16] [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]"
          >
            <WaveBars
              count={110}
              className="h-full"
              style={{ "--amp": 0.5 } as React.CSSProperties}
            />
          </div>

          <SplitReveal
            as="h2"
            text="Every call answered."
            className="relative mx-auto block text-display-xl font-semibold text-on-stage"
            stagger={0.06}
          />
          <SplitReveal
            as="h2"
            text="Every booking captured."
            className="relative mx-auto block text-display-xl font-semibold text-signal"
            stagger={0.06}
            delay={0.06}
          />
        </div>
      </Container>
    </section>
  );
}
