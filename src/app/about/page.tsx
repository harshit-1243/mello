import { Nav } from "@/components/sections/Nav";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "About — mello.ai",
  description:
    "Why we built mello: an AI voice receptionist made for how India actually talks — Hindi and English in the same breath — so no booking is ever lost to a missed call.",
};

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line/60 py-10 sm:py-12 sm:grid sm:grid-cols-[220px_1fr] sm:gap-12">
      <div className="mb-4 sm:mb-0">
        <span className="font-mono text-eyebrow uppercase tracking-widest text-green">
          {label}
        </span>
        <h2 className="mt-2 text-[1.15rem] font-semibold leading-snug text-ink">
          {title}
        </h2>
      </div>
      <div className="prose-legal max-w-prose text-[1.05rem] leading-relaxed text-ink-muted">
        {children}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero strip */}
        <section
          data-nav="dark"
          className="is-stage relative isolate overflow-hidden bg-stage pt-32 pb-16 sm:pt-40 sm:pb-20"
        >
          <div aria-hidden className="aurora" />
          <div aria-hidden className="aurora aurora--2" />
          <Container className="relative">
            <Reveal>
              <p className="font-mono text-eyebrow uppercase tracking-widest text-signal">
                About
              </p>
            </Reveal>
            <SplitReveal
              as="h1"
              text="Built for how India actually talks."
              className="mt-4 font-display text-display-sm text-on-stage text-balance"
            />
            <Reveal
              as="p"
              delay={0.15}
              className="mt-5 max-w-2xl text-[1.1rem] leading-relaxed text-on-stage/65"
            >
              mello is an AI voice receptionist for the places people call to book
              a slot — turfs, gyms, clubs and more. It answers every call, checks
              live availability, takes the booking, and confirms on WhatsApp —
              naturally switching between Hindi and English the way your callers
              actually speak.
            </Reveal>
          </Container>
        </section>

        <section className="bg-paper py-6 sm:py-10">
          <Container>
           <Reveal stagger={0.08} y={28}>
            <Section label="The problem" title="A missed call is a missed booking.">
              <p>
                Front desks are busy. Phones ring during peak hours, after close,
                and mid-rush — and every unanswered call is a slot that sits empty
                and a customer who books somewhere else. For a facility running on
                bookings, that&rsquo;s real revenue walking out the door, quietly,
                every single day.
              </p>
            </Section>

            <Section
              label="The moat"
              title="Bilingual, the way callers really talk."
            >
              <p>
                Global voice bots speak English and bill in dollars. But an Indian
                caller switches between Hindi and English in the same breath —{" "}
                <span className="font-medium text-ink">
                  &ldquo;kal shaam 7 baje turf chahiye.&rdquo;
                </span>{" "}
                mello was built for that from day one. It understands code-switching,
                handles members and group rules, and never sounds like a robot
                reading a script.
              </p>
            </Section>

            <Section
              label="What it does"
              title="It answers — and it reaches out."
            >
              <p>
                <span className="font-medium text-ink">Inbound:</span> picks up
                24/7, checks availability, books the slot, and confirms on
                WhatsApp before the caller hangs up.
              </p>
              <p className="mt-4">
                <span className="font-medium text-ink">Outbound:</span> calls your
                contacts toward a goal — booking confirmations, membership
                renewals, win-backs and no-show follow-ups — with every call and
                outcome logged to your dashboard.
              </p>
            </Section>

            <Section label="Where we are" title="India-first, from Mumbai.">
              <p>
                We&rsquo;re a small, focused team building from Mumbai for Indian
                sports and recreation facilities first — pricing in ₹, tuned for
                local accents and the way bookings actually happen here. The same
                engine scales to any language and any market when we&rsquo;re ready
                to go wider.
              </p>
            </Section>

            <Section label="Our promise" title="Trusted with your data.">
              <p>
                mello is a trusted processor, not a data harvester. Call audio is
                destroyed within about a minute, transcripts are kept only as long
                as they&rsquo;re useful, and every facility&rsquo;s data stays in
                its own isolated space. We earn the right to handle your calls by
                protecting them.
              </p>
            </Section>
           </Reveal>
          </Container>
        </section>

        {/* CTA */}
        <section
          data-nav="dark"
          className="is-stage bg-stage py-20 text-center sm:py-24"
        >
          <Container>
            <h2 className="mx-auto max-w-2xl font-display text-display-sm text-on-stage text-balance">
              See mello answer a live call.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-on-stage/65">
              A 30-minute demo, set up for a facility like yours.
            </p>
            <div className="mt-9 flex justify-center">
              <Button href={SITE.CALENDLY_URL} external size="lg">
                Book a Demo
              </Button>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
