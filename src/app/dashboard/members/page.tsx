import { getMembers } from "@/lib/dashboard/data";
import { formatPhone } from "@/lib/dashboard/format";
import { PageHeader, Panel, Badge } from "@/components/dashboard/DashUI";

export default async function MembersPage() {
  const { members, groups } = await getMembers();

  return (
    <>
      <PageHeader title="Members" subtitle={`${members.length} members · ${groups.length} groups`} />

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Members">
          {members.map((m) => (
            <div key={m.phone} className="flex items-center gap-3.5 border-b border-line px-5 py-3.5 last:border-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-green to-green-press text-[13px] font-semibold text-on-green">
                {m.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">{m.name}</span>
                <span className="tabular block text-[12.5px] text-ink-muted">{formatPhone(m.phone)}</span>
              </span>
              <Badge tone="muted">{m.tier}</Badge>
              <span className="hidden w-[112px] text-right text-[12.5px] text-ink-muted sm:block">
                joined {new Date(m.joinedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Groups">
          <div className="p-5 text-[12.5px] text-ink-muted">
            Members in the same group can&rsquo;t double-book the same sport within ±2 hours.
          </div>
          {groups.map((g) => (
            <div key={g.id} className="border-t border-line px-5 py-3.5">
              <div className="mb-2 text-[14px] font-semibold text-ink">{g.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.memberNames.map((n) => (
                  <Badge key={n} tone="neutral">
                    {n}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
