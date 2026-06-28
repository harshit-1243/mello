import { Nav } from "@/components/sections/Nav";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Spotlight } from "@/components/ui/Spotlight";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Contact — mello.ai",
  description:
    "Talk to mello — book a 30-minute demo, email us, or reach out on social. India-first AI voice receptionist, built in Mumbai.",
};

const methods = [
  {
    label: "Book a demo",
    value: "30 minutes, set up for a facility like yours",
    href: SITE.CALENDLY_URL,
    external: true,
    cta: "Pick a time",
  },
  {
    label: "Email",
    value: SITE.CONTACT_EMAIL,
    href: `mailto:${SITE.CONTACT_EMAIL}`,
    cta: "Send a mail",
  },
  {
    label: "Where we are",
    value: SITE.location,
    href: null,
    cta: null,
  },
];

export default function ContactPage() {
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
                Contact
              </p>
            </Reveal>
            <SplitReveal
              as="h1"
              text="Let's talk."
              className="mt-4 font-display text-display-sm text-on-stage text-balance"
            />
            <Reveal
              as="p"
              delay={0.15}
              className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-on-stage/65"
            >
              The fastest way to see mello is a live demo — we&rsquo;ll answer a
              real call and book it in front of you. Prefer email or a DM?
              We&rsquo;re here for that too.
            </Reveal>
          </Container>
        </section>

        {/* Contact methods */}
        <section className="bg-paper py-16 sm:py-20">
          <Container>
            <Reveal className="grid gap-5 sm:grid-cols-3" stagger={0.1} y={26}>
              {methods.map((m) => (
                <Spotlight
                  key={m.label}
                  className="relative flex flex-col overflow-hidden rounded-4xl border border-line bg-paper-raised p-7 shadow-soft transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-green/30"
                >
                  <span className="relative font-mono text-eyebrow uppercase tracking-widest text-green">
                    {m.label}
                  </span>
                  <p className="relative mt-3 flex-1 text-[1.05rem] leading-relaxed text-ink">
                    {m.value}
                  </p>
                  {m.href && m.cta && (
                    <a
                      href={m.href}
                      target={m.external ? "_blank" : undefined}
                      rel={m.external ? "noopener noreferrer" : undefined}
                      className="relative mt-6 inline-flex items-center gap-1 text-[0.97rem] font-medium text-green underline decoration-green/30 underline-offset-4 transition-colors hover:decoration-green"
                    >
                      {m.cta} &rarr;
                    </a>
                  )}
                </Spotlight>
              ))}
            </Reveal>

            {/* Socials */}
            <div className="mt-12 border-t border-line/60 pt-8">
              <p className="text-[1.02rem] text-ink-muted">
                Or find us on{" "}
                <a
                  href={SITE.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green underline decoration-green/30 underline-offset-4 hover:decoration-green"
                >
                  LinkedIn
                </a>{" "}
                and{" "}
                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green underline decoration-green/30 underline-offset-4 hover:decoration-green"
                >
                  Instagram
                </a>
                .
              </p>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section
          data-nav="dark"
          className="is-stage bg-stage py-20 text-center sm:py-24"
        >
          <Container>
            <h2 className="mx-auto max-w-2xl font-display text-display-sm text-on-stage text-balance">
              Stop losing bookings to missed calls.
            </h2>
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
