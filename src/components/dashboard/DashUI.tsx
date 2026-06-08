import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CallStatus } from "@/lib/dashboard/data";

/** A stat card on the light work area. */
export function StatCard({
  label,
  value,
  note,
  noteTone = "green",
}: {
  label: string;
  value: string;
  note?: string;
  noteTone?: "green" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5 shadow-soft">
      <div className="text-[12.5px] font-medium text-ink-muted">{label}</div>
      <div className="tabular mt-2.5 text-[34px] font-semibold tracking-[-0.03em] text-ink">{value}</div>
      {note && (
        <div className={cn("mt-1.5 text-[12.5px] font-semibold", noteTone === "green" ? "text-green" : "text-ink-muted")}>
          {note}
        </div>
      )}
    </div>
  );
}

/** A bordered panel with a header + optional "view all" link. */
export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-paper-raised">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {action && (
          <Link href={action.href} className="text-[12.5px] font-semibold text-green hover:underline">
            {action.label} →
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

const TAG_STYLES: Record<CallStatus, string> = {
  booked: "bg-green/[0.13] text-green",
  handled: "bg-green/[0.13] text-green",
  missed: "bg-danger/[0.12] text-danger",
};
const TAG_LABEL: Record<CallStatus, string> = { booked: "Booked ✓", handled: "Handled", missed: "Missed" };

export function StatusTag({ status }: { status: CallStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold", TAG_STYLES[status])}>
      {TAG_LABEL[status]}
    </span>
  );
}

/** Standard page header: title + subtitle on the left, optional slot on the right. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[30px] font-semibold tracking-tightest text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] text-ink-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

/** A small neutral/tinted pill used for member/source/tier badges. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "muted" | "amber";
}) {
  const styles: Record<string, string> = {
    neutral: "border border-line bg-paper text-ink-muted",
    green: "bg-green/[0.13] text-green",
    muted: "bg-ink/[0.06] text-ink-muted",
    amber: "bg-[#9a6b1a]/[0.12] text-[#9a6b1a]",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold", styles[tone])}>{children}</span>
  );
}

/** The "1 call live now" pill for page headers. */
export function LivePill({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised px-3.5 py-2 text-[13px] font-semibold text-ink">
      <span className="relative inline-block h-[9px] w-[9px] rounded-full bg-signal">
        <span className="absolute inset-0 animate-signal-pulse rounded-full bg-signal" aria-hidden />
      </span>
      {count} call{count === 1 ? "" : "s"} live now
    </span>
  );
}
