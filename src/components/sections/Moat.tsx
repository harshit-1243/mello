import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Check, X, Globe } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const them = ["English-only", "USD pricing", "No Hindi · no code-switching"];
const mello = [
  "Bilingual — Hindi + English",
  "₹ pricing, India-first",
  "Built for India, ready to scale",
];

export function Moat() {
  return (
    <section
      data-nav="dark"
      className="is-stage relative z-10 -mt-6 overflow-hidden rounded-t-[1.75rem] bg-stage py-28 text-on-stage shadow-[0_-30px_70px_-40px_rgba(0,0,0,0.55)] sm:-mt-12 sm:rounded-t-[2.75rem] sm:py-36 lg:py-44"
    >
      {/* faint radial signal glow */}
      <div
        aria-hidden
        className="glow-signal pointer-events-none absolute -top-1/3 left-1/2 h-[120%] w-[80%] -translate-x-1/2"
      />

      <Container className="relative">
        <Reveal className="max-w-3xl">
          <Eyebrow onStage>Why mello wins</Eyebrow>
        </Reveal>
        <h2 className="mt-6 max-w-5xl text-display text-on-stage text-balance">
          <SplitReveal
            as="span"
            text="Built for how India actually talks —"
            className="block"
          />
          <SplitReveal
            as="span"
            text="ready for everywhere else."
            className="block text-signal"
            delay={0.12}
          />
        </h2>
        <Reveal
          as="p"
          delay={0.1}
          className="mt-8 max-w-prose text-xl leading-relaxed text-on-stage/70"
        >
          Global voice bots speak English and bill in dollars. Indian callers
          switch between Hindi and English in the same breath &mdash;{" "}
          <span className="rounded-md bg-signal/10 px-1.5 py-0.5 font-mono text-[0.95em] text-signal">
            &ldquo;kal shaam 7 baje turf chahiye.&rdquo;
          </span>{" "}
          Mello was built for that from day one. The same engine scales to any
          language and any market.
        </Reveal>

        <Reveal className="mt-14 grid gap-4 md:grid-cols-2" stagger={0.1} y={26}>
          {/* Them */}
          <div className="rounded-4xl border border-white/10 bg-white/[0.02] p-7">
            <p className="font-mono text-eyebrow uppercase text-on-stage/45">
              Global voice bots
            </p>
            <ul className="mt-6 space-y-4">
              {them.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-3 text-on-stage/55"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
                    <X className="h-4 w-4 text-on-stage/40" />
                  </span>
                  <span className="text-[1.02rem]">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mello */}
          <div
            className={cn(
              "relative overflow-hidden rounded-4xl border border-signal/25 bg-stage-raised p-7",
              "shadow-[0_0_0_1px_rgba(54,221,131,0.06),0_30px_60px_-30px_rgba(0,0,0,0.8)]",
            )}
          >
            <div
              aria-hidden
              className="glow-signal pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-70"
            />
            <div className="relative flex items-center justify-between">
              <p className="font-mono text-eyebrow uppercase text-signal">
                Mello
              </p>
              <Globe className="h-5 w-5 text-signal/70" />
            </div>
            <ul className="relative mt-6 space-y-4">
              {mello.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-3 text-on-stage"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-signal/15">
                    <Check className="h-4 w-4 text-signal" />
                  </span>
                  <span className="text-[1.02rem] font-medium">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
