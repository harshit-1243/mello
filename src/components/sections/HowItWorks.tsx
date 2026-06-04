import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Phone, CalendarCheck, MessageCheck } from "@/components/ui/icons";

const steps = [
  {
    n: "01",
    icon: Phone,
    title: "The phone rings.",
    body: "7 AM or 2 AM, peak hour or match time — Mello answers in your business's name.",
  },
  {
    n: "02",
    icon: CalendarCheck,
    title: "Mello books it.",
    body: "Understands the request in Hindi or English, checks live availability, handles memberships and group rules, confirms the slot on the call.",
  },
  {
    n: "03",
    icon: MessageCheck,
    title: "WhatsApp seals it.",
    body: "A confirmation lands in 30 seconds. Reschedules and questions handle themselves. You wake up to bookings, not voicemails.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative z-10 scroll-mt-24 border-y border-line bg-paper-raised/60 py-24 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="max-w-3xl">
          <Eyebrow>How it works</Eyebrow>
        </Reveal>
        <SplitReveal
          as="h2"
          text="Set it up once. Stop missing calls forever."
          className="mt-6 max-w-4xl text-display text-ink text-balance"
        />

        <div className="relative mt-16">
          {/* connecting hairline (desktop) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-line lg:block"
          />
          <Reveal
            className="grid gap-10 lg:grid-cols-3 lg:gap-8"
            stagger={0.12}
            y={28}
          >
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-10 right-0 select-none font-display text-[6.5rem] font-semibold leading-none tracking-tighter text-ink/[0.05] lg:text-[8.5rem]"
                  >
                    {s.n}
                  </span>
                  <div className="relative">
                    <span className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-paper text-green shadow-soft">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-7 text-2xl font-semibold text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-[1.02rem] leading-relaxed text-ink-muted">
                      {s.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
