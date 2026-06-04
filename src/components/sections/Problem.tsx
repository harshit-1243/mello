import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { PhoneMissed, Clock, Phone } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const losses = [
  {
    icon: PhoneMissed,
    label: "Peak-hour calls → voicemail",
    tone: "danger" as const,
    n: "01",
  },
  {
    icon: Clock,
    label: "₹15K+/mo for a desk that sleeps",
    tone: "ink" as const,
    n: "02",
  },
  {
    icon: Phone,
    label: "After-hours calls answered: 0 → ∞",
    tone: "green" as const,
    n: "03",
  },
];

const toneClasses: Record<string, string> = {
  danger: "bg-danger/[0.08] text-danger",
  ink: "bg-ink/[0.06] text-ink",
  green: "bg-green/[0.09] text-green",
};

export function Problem() {
  return (
    <section className="relative z-10 bg-paper py-24 sm:py-28 lg:py-36">
      <Container>
        <Reveal className="max-w-4xl">
          <Eyebrow>The cost of a missed call</Eyebrow>
        </Reveal>
        <SplitReveal
          as="h2"
          text="Every missed call is a booking that didn’t happen."
          className="mt-6 max-w-4xl text-display text-ink text-balance"
        />

        <Reveal
          as="p"
          delay={0.05}
          className="mt-8 max-w-prose text-xl leading-relaxed text-ink-muted"
        >
          Your staff are on the field, not the phone. Calls roll to voicemail.
          The customer books the next turf instead. A full-time receptionist
          costs <span className="font-medium text-ink">₹15,000+ a month</span>{" "}
          &mdash; and still clocks out at night. A busy facility makes{" "}
          <span className="font-medium text-ink">₹3&ndash;4 lakh a month</span>{" "}
          from bookings, and loses a slice of it every single day to calls
          nobody picked up.
        </Reveal>

        <Reveal
          className="mt-14 grid gap-4 sm:grid-cols-3"
          stagger={0.08}
          y={28}
        >
          {losses.map((l) => {
            const Icon = l.icon;
            return (
              <div
                key={l.n}
                className="group rounded-4xl border border-line bg-paper-raised p-6 transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                      toneClasses[l.tone],
                    )}
                  >
                    <Icon className="h-[22px] w-[22px]" />
                  </span>
                  <span className="font-mono text-xs text-ink-muted/70 tabular">
                    {l.n}
                  </span>
                </div>
                <p className="mt-6 text-lg font-medium leading-snug text-ink text-balance">
                  {l.label}
                </p>
              </div>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}
