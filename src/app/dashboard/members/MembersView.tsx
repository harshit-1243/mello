"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import type { MemberRow, GroupRow } from "@/lib/dashboard/data";
import { formatPhone } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";

// On-brand avatar gradients: violet ↔ cyan family only (no rainbow).
const GRADIENTS = [
  ["#C4B3FF", "#6A4FD0"], ["#9BE9F0", "#1FA8C0"], ["#B79BFF", "#7C4DD0"],
  ["#7FE0EA", "#2C8FB0"], ["#D6C2F5", "#8A5CD0"], ["#A5E8F5", "#3A9FCF"],
  ["#CBB6FF", "#6F50C8"], ["#8FD8E8", "#2585A8"], ["#B9A0F0", "#5E3FB0"],
];

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "··";
}

function joinedLabel(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `Joined ${new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(d)}`;
}

function MemberCard({ m, idx, groups }: { m: MemberRow; idx: number; groups: string[] }) {
  const [from, to] = GRADIENTS[idx % GRADIENTS.length];
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-150"
      style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(167,139,250,0.2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#2A2348")}>
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`, color: "#0C0820", boxShadow: "0 0 14px rgba(167,139,250,0.18)" }}>
          {initials(m.name)}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide capitalize"
            style={{ color: m.active ? "#A78BFA" : "#8C86A8", border: `1px solid ${m.active ? "rgba(167,139,250,0.35)" : "#2A2348"}`, background: m.active ? "rgba(167,139,250,0.08)" : "transparent" }}>
            {m.active ? "Active" : "Inactive"}
          </span>
          {groups.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {groups.map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ color: "#A78BFA", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.18)" }}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="text-[15px] font-semibold mb-0.5" style={{ color: "#F3F1FB" }}>{m.name}</div>
        <div className="text-xs mb-1" style={{ color: "#8C86A8" }}>{formatPhone(m.phone)}</div>
      </div>
      <div style={{ height: 1, background: "#20183C" }} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium capitalize" style={{ color: "#F3F1FB" }}>{m.tier}</div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "#8C86A8" }}>Tier</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-medium" style={{ color: "#F3F1FB" }}>{joinedLabel(m.joinedAt)}</div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "#8C86A8" }}>Membership</div>
        </div>
      </div>
    </div>
  );
}

export function MembersView({ members, groups }: { members: MemberRow[]; groups: GroupRow[] }) {
  const [query, setQuery] = useState("");

  const groupsFor = (name: string) => groups.filter((g) => g.memberNames.includes(name)).map((g) => g.label);

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.phone.includes(query),
  );
  const activeCount = members.filter((m) => m.active).length;

  return (
    <div className="flex-1 px-9 py-7 space-y-6">
      {/* Search + stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-sm" style={{ background: "#181030", border: "1px solid #2A2348" }}>
          <Search size={15} style={{ color: "#8C86A8" }} />
          <input type="text" placeholder="Search members…" value={query} onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-[#8C86A8]" style={{ color: "#F3F1FB" }} />
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {[{ label: "Total", value: members.length }, { label: "Active", value: activeCount }, { label: "Groups", value: groups.length }].map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "#181030", border: "1px solid #2A2348" }}>
              <div>
                <div style={{ fontFamily: GS, fontSize: 22, fontWeight: 400, color: "#F3F1FB", lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-[0.1em] mt-0.5" style={{ color: "#8C86A8" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((m, i) => <MemberCard key={m.phone} m={m} idx={i} groups={groupsFor(m.name)} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl text-sm gap-2"
          style={{ background: "#181030", border: "1px solid #2A2348", color: "#8C86A8" }}>
          <Users size={28} style={{ color: "#2A2348" }} />
          {members.length === 0 ? "No members yet." : `No members match "${query}"`}
        </div>
      )}
    </div>
  );
}
