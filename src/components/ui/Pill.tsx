import { cn } from "@/lib/cn";

type Tone = "default" | "green" | "signal" | "danger" | "stage";

const tones: Record<Tone, string> = {
  default: "bg-paper-raised text-ink-muted border-line",
  green: "bg-green/[0.08] text-green border-green/20",
  signal: "bg-signal/10 text-[#0B6238] border-signal/30",
  danger: "bg-danger/[0.08] text-danger border-danger/25",
  stage: "bg-white/[0.05] text-on-stage/85 border-white/10",
};

export function Pill({
  children,
  tone = "default",
  dot = false,
  live = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.8rem] font-medium leading-none",
        tones[tone],
        className,
      )}
    >
      {live ? (
        <span className="signal-dot shrink-0" />
      ) : dot ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}
