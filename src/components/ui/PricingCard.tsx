import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Check } from "@/components/ui/icons";
import { SITE } from "@/lib/site";

export type Plan = {
  name: string;
  price: string;
  period?: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export function PricingCard({ plan }: { plan: Plan }) {
  const { name, price, period, blurb, features, cta, featured } = plan;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-4xl border p-7 transition-[transform,box-shadow,border-color] duration-300 ease-out-expo sm:p-8",
        featured
          ? "border-green/35 bg-paper-raised shadow-lift lg:-translate-y-3"
          : "border-line bg-paper-raised/70 shadow-soft hover:-translate-y-1 hover:shadow-lift",
      )}
    >
      {featured && (
        <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-green px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-wide text-on-green">
          <span className="signal-dot" />
          Most popular
        </span>
      )}

      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-[1.35rem] font-semibold text-ink">
          {name}
        </h3>
      </div>
      <p className="mt-2 min-h-[2.5rem] max-w-[24ch] text-[0.95rem] leading-snug text-ink-muted">
        {blurb}
      </p>

      <div className="mt-6 flex items-end gap-1.5">
        <span className="font-display text-[2.75rem] font-semibold leading-none tracking-tight text-ink tabular">
          {price}
        </span>
        {period && (
          <span className="pb-1 font-mono text-sm text-ink-muted">{period}</span>
        )}
      </div>

      <div className="my-7 h-px w-full bg-line" />

      <ul className="flex flex-1 flex-col gap-3.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[0.95rem] text-ink">
            <Check
              className={cn(
                "mt-0.5 h-[18px] w-[18px] shrink-0",
                featured ? "text-green" : "text-green/80",
              )}
            />
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          href={SITE.CALENDLY_URL}
          external
          variant={featured ? "primary" : "secondary"}
          size="md"
          className="w-full"
        >
          {cta}
        </Button>
      </div>
    </div>
  );
}
