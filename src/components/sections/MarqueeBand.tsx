import { Marquee } from "@/components/ui/Marquee";

const PHRASES = [
  "Never miss a call",
  "Hindi + English",
  "Booked in seconds",
  "24/7 answering",
  "Zero voicemails",
  "Every call, answered",
];

export function MarqueeBand() {
  const items = PHRASES.map((p, i) => (
    <span
      key={i}
      className={i % 2 === 1 ? "text-green" : "text-ink"}
    >
      {p}
    </span>
  ));

  return (
    <section
      aria-hidden
      className="relative z-10 overflow-hidden border-y border-line bg-paper-raised/50 py-7 sm:py-9"
    >
      <Marquee
        duration={34}
        items={items}
        itemClassName="px-1 text-[clamp(1.5rem,3.4vw,2.9rem)] font-display font-semibold uppercase tracking-tight text-ink/30"
      />
    </section>
  );
}
