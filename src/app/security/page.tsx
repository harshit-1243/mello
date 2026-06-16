import { Nav } from "@/components/sections/Nav";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Security — mello.ai",
  description:
    "How mello protects caller data: audio never stored, per-facility isolation, encryption at rest and in transit.",
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
      <div className="prose-legal">{children}</div>
    </div>
  );
}

export default function SecurityPage() {
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
              Trust
            </p>
            <h1 className="mt-4 font-display text-display-sm text-on-stage">
              Security
            </h1>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-on-stage/65">
              mello never records your voice. Every facility&rsquo;s data lives
              in its own isolated silo. Here is exactly what we do — and don&rsquo;t
              do — to keep your data safe.
            </p>
          </Container>
        </section>

        {/* Content */}
        <section className="bg-paper py-4">
          <Container className="max-w-[860px]">
            <Section label="01" title="Audio is never stored">
              <p>
                Your voice exists in mello&rsquo;s systems for one purpose only:
                real-time transcription. The audio stream is processed as it
                arrives and discarded within <strong>60 seconds</strong> of your
                call ending. There is no audio file, no recording, and no way to
                replay your voice — not even by us.
              </p>
              <p>
                This is an architectural decision, not a policy one. Audio
                storage was deliberately excluded from the data model.
              </p>
            </Section>

            <Section label="02" title="Per-facility data isolation">
              <p>
                Every facility on mello is a separate tenant. We enforce
                isolation at the database layer using{" "}
                <strong>Row-Level Security (RLS)</strong> in PostgreSQL via
                Supabase. Every query is scoped to a single{" "}
                <code>facility_id</code> — a facility&rsquo;s admin dashboard,
                API calls, and analytics can only ever see that facility&rsquo;s
                own data.
              </p>
              <p>
                Facility A cannot see Facility B&rsquo;s callers, bookings, or
                transcripts — even though they share the same database instance.
                This is enforced at the query level, not the application level.
              </p>
            </Section>

            <Section label="03" title="Encryption">
              <ul>
                <li>
                  <strong>In transit</strong> — all connections use TLS 1.2 or
                  higher. This covers Twilio → mello, mello → Sarvam AI, mello
                  → Supabase, and the WhatsApp delivery leg.
                </li>
                <li>
                  <strong>At rest</strong> — all data stored in Supabase is
                  encrypted with AES-256 at the storage layer.
                </li>
                <li>
                  <strong>Payment data</strong> — mello never stores card
                  numbers, UPI IDs, or payment credentials. Payment links are
                  created via Razorpay&rsquo;s API and delivered directly to the
                  caller over WhatsApp. We store only the amount and link status.
                </li>
              </ul>
            </Section>

            <Section label="04" title="Data residency">
              <p>
                All caller data — transcripts, bookings, call logs — is stored
                in India using Supabase&rsquo;s India region. Data never leaves
                India for storage purposes.
              </p>
              <p>
                Speech processing (STT, LLM, TTS) is handled by{" "}
                <strong>Sarvam AI</strong>, an Indian AI company, keeping the
                full call pipeline within India.
              </p>
            </Section>

            <Section label="05" title="Access controls">
              <ul>
                <li>
                  <strong>Facility admins</strong> authenticate via Supabase
                  magic-link email — no passwords to leak. Sessions are
                  short-lived and stored in secure HTTP-only cookies.
                </li>
                <li>
                  <strong>Management API</strong> — internal API endpoints
                  require a Bearer token. No endpoint that reads or writes
                  facility data is publicly accessible without authentication.
                </li>
                <li>
                  <strong>Caller identity</strong> — the caller&rsquo;s phone
                  number is supplied by Twilio directly to the server, never by
                  the AI model. This means the model cannot be prompted to
                  impersonate another caller.
                </li>
              </ul>
            </Section>

            <Section label="06" title="Audit trail">
              <p>
                Every sensitive operation is recorded in an immutable audit log:
                data deletions, transcript purges, admin logins, and right-to-delete
                requests. The log records who did what, when, and on which facility.
              </p>
              <p>
                Transcript purges run automatically every 24 hours, deleting
                records older than 90 days. Each purge cycle is audited with the
                count of records removed.
              </p>
            </Section>

            <Section label="07" title="Right to delete">
              <p>
                Callers can request immediate deletion of all their data at any
                point during a call by saying &ldquo;delete my data.&rdquo; Mello
                will erase the transcript, tool-call records, and booking history
                for that caller at that facility and confirm verbally.
              </p>
              <p>
                Facility admins can trigger a full data purge for any caller
                from the dashboard. All deletions are recorded in the audit log.
              </p>
            </Section>

            <Section label="08" title="Responsible disclosure">
              <p>
                Found a security issue? Please email{" "}
                <a
                  href={`mailto:${SITE.CONTACT_EMAIL}`}
                  className="text-green underline-offset-2 hover:underline"
                >
                  {SITE.CONTACT_EMAIL}
                </a>{" "}
                with a clear description. We will acknowledge within 48 hours
                and aim to resolve confirmed vulnerabilities within 14 days.
                Please do not publicly disclose until we have had a chance to
                investigate.
              </p>
            </Section>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
