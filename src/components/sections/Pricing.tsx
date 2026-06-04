import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { PricingCard, type Plan } from "@/components/ui/PricingCard";

const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "/mo",
    blurb: "Everything to stop missing calls at a single facility.",
    features: [
      "500 voice minutes",
      "1 facility",
      "Mello Book + Mello Chat",
      "Email support",
    ],
    cta: "Book a Demo",
  },
  {
    name: "Growth",
    price: "₹9,999",
    period: "/mo",
    blurb: "For busy facilities and growing multi-court operators.",
    features: [
      "1,500 voice minutes",
      "Up to 3 facilities",
      "Priority support",
      "Analytics dashboard",
    ],
    cta: "Book a Demo",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "For multi-location chains with custom requirements.",
    features: [
      "Unlimited voice minutes",
      "Multi-location",
      "Dedicated account manager",
      "Custom SLAs",
    ],
    cta: "Talk to us",
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative z-10 scroll-mt-24 border-t border-line bg-paper-raised/50 py-24 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="max-w-3xl">
          <Eyebrow>Pricing</Eyebrow>
        </Reveal>
        <SplitReveal
          as="h2"
          text="Pricing that pays for itself in one recovered booking."
          className="mt-6 max-w-5xl text-display text-ink text-balance"
        />
        <Reveal
          as="p"
          delay={0.05}
          className="mt-7 max-w-prose text-xl leading-relaxed text-ink-muted"
        >
          Simple monthly plans in ₹. No per-seat games, no surprises &mdash;
          just a front desk that never misses.
        </Reveal>

        <Reveal
          className="mt-16 grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6"
          stagger={0.1}
          y={30}
        >
          {plans.map((p) => (
            <PricingCard key={p.name} plan={p} />
          ))}
        </Reveal>

        <Reveal
          as="p"
          className="mx-auto mt-12 max-w-2xl text-center font-mono text-[0.82rem] leading-relaxed text-ink-muted tabular"
        >
          Overage ₹8/min beyond your bundle · one-time onboarding ₹10,000&ndash;25,000
          (setup, data migration &amp; training) · no hidden fees.
        </Reveal>
      </Container>
    </section>
  );
}
