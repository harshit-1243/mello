import { getSettings } from "@/lib/dashboard/data";
import { PageHeader, Panel, Badge } from "@/components/dashboard/DashUI";

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <>
      <PageHeader title="Settings" subtitle={`${s.facilityName} · ${s.city}`} />

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel title="Facility">
          <div className="space-y-3 p-5 text-[14px]">
            <Row label="Name" value={s.facilityName} />
            <Row label="City" value={s.city} />
            <Row label="Hours" value={s.hoursLabel} />
            <Row label="Member-only windows" value={s.memberWindows.join(" · ")} />
          </div>
        </Panel>

        <Panel title="Integrations">
          {s.integrations.map((it) => (
            <div key={it.label} className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-0">
              <span className="flex-1 text-[14px] font-semibold text-ink">{it.label}</span>
              <span className="text-[12.5px] text-ink-muted">{it.detail}</span>
              {it.status === "connected" ? <Badge tone="green">Connected</Badge> : <Badge tone="muted">Not set</Badge>}
            </div>
          ))}
        </Panel>

        <Panel title="Sports & pricing">
          {s.sports.map((sp) => (
            <div key={sp.name} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0 text-[14px]">
              <span className="flex-1 font-semibold text-ink">{sp.name}</span>
              <span className="text-[12.5px] text-ink-muted">
                {sp.courts} court{sp.courts === 1 ? "" : "s"}
              </span>
              <span className="w-[180px] text-right text-[13px] text-ink">{sp.priceLabel}</span>
            </div>
          ))}
        </Panel>

        <Panel title="Privacy & data">
          <div className="space-y-3 p-5 text-[14px]">
            <Row label="Audio retention" value={`${s.privacy.audioSeconds} seconds, then destroyed`} />
            <Row label="Transcript retention" value={`${s.privacy.transcriptDays} days, then auto-deleted`} />
            <p className="pt-1 text-[12.5px] text-ink-muted">
              Data stays in India · never sold or shared · every internal access is audited.
            </p>
            <button className="mt-1 rounded-lg border border-danger/40 px-3 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/[0.06]">
              Delete all facility data
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
