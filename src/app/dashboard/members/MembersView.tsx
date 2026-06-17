"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import type { MemberRow, GroupRow } from "@/lib/dashboard/data";
import { formatPhone } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";

const GRADIENTS = [
  ["#5FF0B0", "#1E7A55"], ["#93C5FD", "#2563EB"], ["#C4B5FD", "#7C3AED"],
  ["#FCA5A5", "#DC2626"], ["#FDE68A", "#D97706"], ["#6EE7B7", "#059669"],
  ["#FBCFE8", "#BE185D"], ["#A5F3FC", "#0891B2"], ["#D9F99D", "#65A30D"],
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
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(52,211,153,0.2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#1B2722")}>
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`, color: "#07100C", boxShadow: "0 0 14px rgba(52,211,153,0.18)" }}>
          {initials(m.name)}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide capitalize"
            style={{ color: m.active ? "#34D399" : "#7E908A", border: `1px solid ${m.active ? "rgba(52,211,153,0.35)" : "#1B2722"}`, background: m.active ? "rgba(52,211,153,0.08)" : "transparent" }}>
            {m.active ? "Active" : "Inactive"}
          </span>
          {groups.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {groups.map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ color: "#34D399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.18)" }}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="text-[15px] font-semibold mb-0.5" style={{ color: "#F4F8F6" }}>{m.name}</div>
        <div className="text-xs mb-1" style={{ color: "#7E908A" }}>{formatPhone(m.phone)}</div>
      </div>
      <div style={{ height: 1, background: "#16201B" }} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium capitalize" style={{ color: "#F4F8F6" }}>{m.tier}</div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "#7E908A" }}>Tier</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-medium" style={{ color: "#F4F8F6" }}>{joinedLabel(m.joinedAt)}</div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "#7E908A" }}>Membership</div>
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
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-sm" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
          <Search size={15} style={{ color: "#7E908A" }} />
          <input type="text" placeholder="Search members…" value={query} onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-[#7E908A]" style={{ color: "#F4F8F6" }} />
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {[{ label: "Total", value: members.length }, { label: "Active", value: activeCount }, { label: "Groups", value: groups.length }].map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
              <div>
                <div style={{ fontFamily: GS, fontSize: 22, fontWeight: 400, color: "#F4F8F6", lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-[0.1em] mt-0.5" style={{ color: "#7E908A" }}>{s.label}</div>
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
          style={{ background: "#0E1714", border: "1px solid #1B2722", color: "#7E908A" }}>
          <Users size={28} style={{ color: "#1B2722" }} />
          {members.length === 0 ? "No members yet." : `No members match "${query}"`}
        </div>
      )}
    </div>
  );
}
