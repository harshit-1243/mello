import { Nav } from "@/components/sections/Nav";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy — mello.ai",
  description:
    "How mello collects, uses, and protects the data of callers and facility operators.",
};

const EFFECTIVE = "June 2026";

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
      <div className="prose-legal">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero strip */}
        <section
          data-nav="dark"
          className="is-stage bg-stage pt-32 pb-16 sm:pt-40 sm:pb-20"
        >
          <Container>
            <p className="font-mono text-eyebrow uppercase tracking-widest text-on-stage/50">
              Legal
            </p>
            <h1 className="mt-4 font-display text-display-sm text-on-stage">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-on-stage/65">
              We built mello on one principle: your voice stays yours. Audio is
              never recorded. Transcripts expire. You can delete everything with
              one sentence.
            </p>
            <p className="mt-6 font-mono text-sm text-on-stage/40">
              Effective {EFFECTIVE} &nbsp;·&nbsp; Applies to Mello Voice, Mello
              Book, and Mello Chat
            </p>
          </Container>
        </section>

        {/* Content */}
        <section className="bg-paper py-4">
          <Container className="max-w-[860px]">
            <Section label="01" title="What mello is">
              <p>
                mello.ai provides an AI voice receptionist (Mello Voice), a
                booking-rules engine (Mello Book), and a WhatsApp confirmation
                layer (Mello Chat) to sports and recreational facilities in
                India.
              </p>
              <p>
                When you call a facility powered by mello, you are interacting
                with our service on behalf of that facility operator. The
                facility is the data controller; mello is the data processor.
              </p>
            </Section>

            <Section label="02" title="What we collect">
              <ul>
                <li>
                  <strong>Your phone number</strong> — provided automatically by
                  your carrier when you call. Used to verify membership, process
                  your booking, and send your WhatsApp confirmation.
                </li>
                <li>
                  <strong>Call transcript</strong> — a text record of what was
                  said during the call. Never the audio itself (see §03).
                </li>
                <li>
                  <strong>Booking details</strong> — sport, date, time, duration,
                  and your name, if you made a booking.
                </li>
                <li>
                  <strong>Payment metadata</strong> — the amount and whether a
                  payment link was sent. We never store card numbers, UPI IDs,
                  or any payment credentials.
                </li>
              </ul>
            </Section>

            <Section label="03" title="What we never collect">
              <p>
                <strong>Audio is never stored.</strong> Your voice is
                transcribed in real time as it arrives; the audio stream is
                discarded within 60 seconds of your call ending. We cannot
                replay, share, or analyse your voice — there is nothing to
                retrieve.
              </p>
              <p>
                We do not collect location data, device identifiers, browsing
                history, or any information beyond what you provide during the
                call.
              </p>
            </Section>

            <Section label="04" title="How we use your data">
              <ul>
                <li>To check court availability and create your booking.</li>
                <li>
                  To send a WhatsApp confirmation with your booking details
                  (including the assigned court — the only place the court
                  number appears).
                </li>
                <li>
                  To verify whether you are a member of that facility and apply
                  the correct pricing.
                </li>
                <li>
                  To improve the quality of responses <em>for that facility
                  only</em> — for example, learning which slots are frequently
                  requested so Mello can proactively suggest them. This analysis
                  is scoped to the single facility you called. We never pool
                  your data across facilities.
                </li>
              </ul>
              <p>
                We never sell your data, share it with advertisers, or use it
                to train models outside the scope described above.
              </p>
            </Section>

            <Section label="05" title="How long we keep it">
              <ul>
                <li>
                  <strong>Audio</strong> — destroyed within 60 seconds.
                </li>
                <li>
                  <strong>Transcripts</strong> — automatically purged after 90
                  days. This runs on every server boot and daily thereafter.
                </li>
                <li>
                  <strong>Bookings</strong> — retained as long as the facility
                  operator requires for their records, subject to your deletion
                  request (see §06).
                </li>
                <li>
                  <strong>Audit log</strong> — retained to fulfil our security
                  and compliance obligations.
                </li>
              </ul>
            </Section>

            <Section label="06" title="Your rights">
              <p>
                <strong>Right to delete — say it on the call.</strong> At any
                point during a call, tell Mello &ldquo;delete my data.&rdquo;
                Mello will immediately erase your call transcript, tool-call
                records, and booking history for that facility and confirm the
                deletion verbally.
              </p>
              <p>
                You can also email{" "}
                <a href={`mailto:${SITE.CONTACT_EMAIL}`} className="text-green underline-offset-2 hover:underline">
                  {SITE.CONTACT_EMAIL}
                </a>{" "}
                with your phone number and the facility name, and we will
                process the request within 72 hours.
              </p>
              <p>
                Facility admins can trigger a full data purge for any caller
                from the Mello dashboard.
              </p>
            </Section>

            <Section label="07" title="Data residency & security">
              <p>
                All data is stored in India using Supabase (PostgreSQL). Data is
                encrypted in transit (TLS 1.2+) and at rest (AES-256). Each
                facility&rsquo;s data is isolated using Row-Level Security — no
                facility can access another facility&rsquo;s records.
              </p>
              <p>
                For a detailed breakdown of our security controls, see our{" "}
                <a href="/security" className="text-green underline-offset-2 hover:underline">
                  Security page
                </a>
                .
              </p>
            </Section>

            <Section label="08" title="Changes to this policy">
              <p>
                If we make material changes, we will update the effective date
                at the top of this page. Continued use of any mello-powered
                service after the updated date constitutes acceptance.
              </p>
            </Section>

            <Section label="09" title="Contact">
              <p>
                Questions about this policy? Email us at{" "}
                <a href={`mailto:${SITE.CONTACT_EMAIL}`} className="text-green underline-offset-2 hover:underline">
                  {SITE.CONTACT_EMAIL}
                </a>
                .
              </p>
              <p className="text-ink-muted">
                mello.ai &nbsp;·&nbsp; {SITE.location}
              </p>
            </Section>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
