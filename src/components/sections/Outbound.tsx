import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";

/**
 * Outbound — the other half of Mello. Inbound answers every call; Outbound
 * *makes* them, working a contact list toward a goal (renewals, win-backs,
 * confirmations, follow-ups) in the same natural Hindi-English.
 */
const plays = [
  {
    title: "Booking confirmations",
    body: "Calls ahead to confirm tomorrow's slots, so none quietly go empty.",
  },
  {
    title: "Membership renewals",
    body: "Reaches members before they lapse — and renews right on the call.",
  },
  {
    title: "Win-back",
    body: "Brings lapsed customers back with a friendly, well-timed nudge.",
  },
  {
    title: "No-show follow-ups",
    body: "Follows up on missed slots and rebooks them before they're lost.",
  },
  {
    title: "Lead qualification",
    body: "Calls new enquiries, qualifies them, and books the first visit.",
  },
  {
    title: "Promos & feedback",
    body: "Fills off-peak hours with offers, and gathers feedback after a visit.",
  },
];

export function Outbound() {
  return (
    <section
      id="outbound"
      className="relative z-10 -mt-6 rounded-t-[1.75rem] bg-paper py-24 sm:-mt-12 sm:rounded-t-[2.75rem] sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="max-w-3xl">
          <Eyebrow>Outbound</Eyebrow>
        </Reveal>
        <h2 className="mt-6 max-w-4xl text-display text-ink text-balance">
          <SplitReveal as="span" text="It doesn't just answer." className="block" />
          <SplitReveal
            as="span"
            text="It picks up the phone."
            className="block text-green"
            delay={0.12}
          />
        </h2>
        <Reveal
          as="p"
          delay={0.1}
          className="mt-8 max-w-prose text-xl leading-relaxed text-ink-muted"
        >
          Inbound never misses a call. Outbound makes them — Mello works your
          contact list toward a goal: renewals, win-backs, confirmations and
          follow-ups, in the same natural{" "}
          <span className="font-medium text-ink">Hindi-English</span>. Every call
          logged, every outcome on your dashboard.
        </Reveal>

        <Reveal
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.08}
          y={26}
        >
          {plays.map((p) => (
            <div
              key={p.title}
              className="rounded-4xl border border-line bg-paper-raised p-7 shadow-soft transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-green/30"
            >
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-green" />
                <h3 className="text-[1.12rem] font-semibold text-ink">
                  {p.title}
                </h3>
              </div>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-muted">
                {p.body}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
