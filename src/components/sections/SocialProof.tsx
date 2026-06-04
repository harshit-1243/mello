import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";

const quotes = [
  {
    quote: (
      <>
        A 6-court turf in Navi Mumbai now answers every after-hours call &mdash;
        and recovered{" "}
        <span className="font-medium text-green">40+ bookings</span> in its first
        month.
      </>
    ),
    role: "Operations lead",
    place: "Navi Mumbai",
  },
  {
    quote: (
      <>
        Zero missed calls since switching. Our staff finally stay on the field.
      </>
    ),
    role: "Manager, multi-sport arena",
    place: "Mumbai",
  },
];

const stats = [
  { v: "24/7", l: "Calls answered" },
  { v: "<600ms", l: "Response per turn" },
  { v: "30 sec", l: "To WhatsApp confirm" },
  { v: "Hi + En", l: "And counting" },
];

export function SocialProof() {
  return (
    <section className="relative z-10 -mt-6 rounded-t-[1.75rem] bg-paper py-24 sm:-mt-12 sm:rounded-t-[2.75rem] sm:py-28 lg:py-32">

      <Container>
        <Reveal className="max-w-3xl">
          <Eyebrow>Early signal</Eyebrow>
        </Reveal>
        <SplitReveal
          as="h2"
          text="Quietly going live across Mumbai."
          className="mt-6 max-w-4xl text-display text-ink text-balance"
        />

        <Reveal className="mt-14 grid gap-5 md:grid-cols-2" stagger={0.1} y={26}>
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="flex flex-col justify-between rounded-4xl border border-line bg-paper-raised p-7 shadow-soft sm:p-8"
            >
              <blockquote className="text-[1.3rem] font-medium leading-snug text-ink text-balance">
                <span className="mr-1 font-display text-green">&ldquo;</span>
                {q.quote}
                <span className="ml-0.5 font-display text-green">&rdquo;</span>
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <span className="signal-dot" />
                <span className="font-mono text-sm text-ink-muted">
                  {q.role} · {q.place}
                </span>
              </figcaption>
            </figure>
          ))}
        </Reveal>

        {/* Stat band */}
        <Reveal className="mt-5" y={24}>
          <div className="grid grid-cols-2 divide-line overflow-hidden rounded-4xl border border-line bg-ink text-on-stage sm:grid-cols-4 sm:divide-x">
            {stats.map((s) => (
              <div key={s.l} className="px-6 py-8 text-center">
                <div className="font-mono text-[1.9rem] font-medium tracking-tight text-signal tabular">
                  {s.v}
                </div>
                <div className="mt-2 text-sm text-on-stage/65">{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="p" className="mt-6 text-sm text-ink-muted">
          Piloting now with facilities in Mumbai &amp; Navi Mumbai.{" "}
          <span className="text-ink-muted/70">
            (Replace with named case studies when available.)
          </span>
        </Reveal>
      </Container>
    </section>
  );
}
