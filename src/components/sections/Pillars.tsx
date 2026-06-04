import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Pill } from "@/components/ui/Pill";
import { WaveBars } from "@/components/ui/WaveBars";
import { Check, MessageCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/* ---- Mock illustrations (vector only, no raster) ---- */

function VoiceMock() {
  return (
    <div className="is-stage flex h-44 flex-col justify-between overflow-hidden rounded-2xl bg-stage p-4">
      <div className="flex items-center justify-between">
        <Pill tone="stage" live className="!px-2.5 !py-1 !text-[0.72rem]">
          Live call
        </Pill>
        <span className="font-mono text-[11px] text-on-stage/45 tabular">
          00:38
        </span>
      </div>
      <div className="h-9">
        <WaveBars count={30} className="!gap-[2px]" />
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-on-stage/70">
        &ldquo;Namaste! Baseline Turf &mdash; kya help chahiye?&rdquo;
      </p>
    </div>
  );
}

function BookMock() {
  const slots = [
    { t: "6 PM", s: "open" },
    { t: "7 PM", s: "taken" },
    { t: "8 PM", s: "sel" },
    { t: "9 PM", s: "open" },
  ];
  return (
    <div className="flex h-44 flex-col rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between font-mono text-[11px] text-ink-muted">
        <span>Court 2 · 5-a-side</span>
        <span className="tabular">Tomorrow</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {slots.map((sl) => (
          <div
            key={sl.t}
            className={cn(
              "rounded-lg py-2 text-center font-mono text-[11px] tabular",
              sl.s === "taken" &&
                "bg-danger/10 text-danger line-through decoration-danger/50",
              sl.s === "sel" &&
                "bg-green text-on-green ring-2 ring-green/30 ring-offset-1 ring-offset-paper",
              sl.s === "open" && "bg-paper-raised text-ink-muted",
            )}
          >
            {sl.t}
          </div>
        ))}
      </div>
      <div className="mt-auto space-y-1.5 pt-3">
        {["Membership · Verified", "Double-booking · Blocked"].map((r) => (
          <div
            key={r}
            className="flex items-center gap-2 text-[12px] text-ink"
          >
            <Check className="h-3.5 w-3.5 text-green" />
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatMock() {
  return (
    <div className="flex h-44 flex-col justify-end gap-2 rounded-2xl bg-[#E7F1EA] p-4">
      <div className="max-w-[88%] self-end rounded-2xl rounded-br-md bg-green px-3.5 py-2.5 text-on-green shadow-sm">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold">
          <MessageCheck className="h-4 w-4" />
          Confirmed
        </div>
        <p className="mt-1 text-[12px] leading-snug text-on-green/90">
          Baseline Turf · 5-a-side · Tomorrow, 8:00 PM
        </p>
      </div>
      <div className="max-w-[70%] self-end rounded-2xl rounded-br-md bg-green/90 px-3.5 py-2 text-[11px] text-on-green/90">
        Reply 1 to reschedule.
      </div>
      <span className="self-end pr-1 font-mono text-[10px] text-ink-muted tabular">
        Delivered · 00:30
      </span>
    </div>
  );
}

const pillars = [
  {
    tag: "Mello Voice",
    title: "Answers like your best front-desk manager.",
    body: "Greets in your facility's name, understands Hindi-English mid-sentence, checks live availability and offers alternatives, verifies membership, blocks double-bookings, and confirms on the call. Under 3 minutes, 24/7.",
    mock: <VoiceMock />,
  },
  {
    tag: "Mello Book",
    title: "The rules engine behind every booking.",
    body: "Real-time availability across courts and slots, membership priority, group restrictions, privacy controls, full call transcripts, and an admin dashboard your manager actually understands. One source of truth for the whole facility.",
    mock: <BookMock />,
  },
  {
    tag: "Mello Chat",
    title: "Confirmed on WhatsApp before they've hung up.",
    body: "A confirmation within 30 seconds, reschedules / cancellations / FAQs handled automatically, and only the real exceptions escalated to your staff.",
    mock: <ChatMock />,
  },
];

export function Pillars() {
  return (
    <section
      id="product"
      className="relative z-10 -mt-6 scroll-mt-24 rounded-t-[1.75rem] bg-paper py-24 sm:-mt-12 sm:rounded-t-[2.75rem] sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="max-w-3xl">
          <Eyebrow>The platform</Eyebrow>
        </Reveal>
        <SplitReveal
          as="h2"
          text="Three tools. One platform. Zero missed calls."
          className="mt-6 max-w-4xl text-display text-ink text-balance"
        />
        <Reveal
          as="p"
          delay={0.05}
          className="mt-7 max-w-prose text-xl leading-relaxed text-ink-muted"
        >
          Not a feature list &mdash; a front desk that never sleeps. Each tool
          does one job, and together they close the loop from ring to
          confirmation.
        </Reveal>

        <Reveal
          className="mt-14 grid gap-5 lg:grid-cols-3"
          stagger={0.1}
          y={30}
        >
          {pillars.map((p) => (
            <article
              key={p.tag}
              className="group flex flex-col rounded-4xl border border-line bg-paper-raised p-5 shadow-soft transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-y-1.5 hover:shadow-lift"
            >
              {p.mock}
              <div className="flex flex-1 flex-col px-1.5 pt-6">
                <span className="font-mono text-eyebrow uppercase text-green">
                  {p.tag}
                </span>
                <h3 className="mt-3 text-[1.35rem] font-semibold leading-tight text-ink text-balance">
                  {p.title}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
                  {p.body}
                </p>
              </div>
            </article>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
