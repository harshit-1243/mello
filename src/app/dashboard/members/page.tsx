"use client";

import { useState } from "react";
import { Bell, Search, Plus, Users } from "lucide-react";

const GS = "var(--font-geist-sans)";
type Tier = "Tier 1" | "Tier 2";

interface Member {
  id: number; initials: string; gradFrom: string; gradTo: string;
  name: string; phone: string; tier: Tier; groups: string[];
  bookings: number; lastVisit: string; sport: string;
}

const MEMBERS: Member[] = [
  { id: 1, initials: "AK", gradFrom: "#5FF0B0", gradTo: "#1E7A55", name: "Arjun Kumar",   phone: "+91 97543 87654", tier: "Tier 1", groups: ["G1"],       bookings: 41, lastVisit: "Today",  sport: "Badminton"     },
  { id: 2, initials: "MS", gradFrom: "#93C5FD", gradTo: "#2563EB", name: "Manan Shah",    phone: "+91 96536 79703", tier: "Tier 2", groups: ["G1", "G2"], bookings: 23, lastVisit: "2d ago", sport: "Badminton"     },
  { id: 3, initials: "RM", gradFrom: "#C4B5FD", gradTo: "#7C3AED", name: "Rohan Mehta",   phone: "+91 98812 34567", tier: "Tier 1", groups: ["G2"],       bookings: 37, lastVisit: "1d ago", sport: "Squash"        },
  { id: 4, initials: "SP", gradFrom: "#FCA5A5", gradTo: "#DC2626", name: "Sneha Patel",   phone: "+91 99001 11223", tier: "Tier 2", groups: [],           bookings: 18, lastVisit: "5d ago", sport: "Cricket Turf"  },
  { id: 5, initials: "VN", gradFrom: "#FDE68A", gradTo: "#D97706", name: "Vikram Nair",   phone: "+91 96012 45678", tier: "Tier 1", groups: ["G1", "G3"], bookings: 52, lastVisit: "Today",  sport: "Football Turf" },
  { id: 6, initials: "DJ", gradFrom: "#6EE7B7", gradTo: "#059669", name: "Dev Joshi",     phone: "+91 97234 56789", tier: "Tier 2", groups: ["G3"],       bookings: 14, lastVisit: "1w ago", sport: "Badminton"     },
  { id: 7, initials: "NK", gradFrom: "#FBCFE8", gradTo: "#BE185D", name: "Neha Kapoor",   phone: "+91 96321 55789", tier: "Tier 2", groups: [],           bookings: 9,  lastVisit: "3d ago", sport: "Squash"        },
  { id: 8, initials: "RK", gradFrom: "#A5F3FC", gradTo: "#0891B2", name: "Rahul Khanna",  phone: "+91 99876 54321", tier: "Tier 1", groups: ["G2", "G3"], bookings: 29, lastVisit: "Today",  sport: "Tennis"        },
  { id: 9, initials: "IS", gradFrom: "#D9F99D", gradTo: "#65A30D", name: "Ishaan Sharma", phone: "+91 98765 09876", tier: "Tier 2", groups: ["G1"],       bookings: 6,  lastVisit: "2w ago", sport: "Badminton"     },
];

function MemberCard({ m }: { m: Member }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-150"
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(52,211,153,0.2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#1B2722")}>
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: `linear-gradient(135deg, ${m.gradFrom} 0%, ${m.gradTo} 100%)`, color: "#07100C", boxShadow: "0 0 14px rgba(52,211,153,0.18)" }}>
          {m.initials}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide"
            style={{ color: "#34D399", border: "1px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.08)" }}>
            {m.tier}
          </span>
          {m.groups.length > 0 && (
            <div className="flex items-center gap-1">
              {m.groups.map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ color: "#34D399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.18)" }}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="text-[15px] font-semibold mb-0.5" style={{ color: "#F4F8F6" }}>{m.name}</div>
        <div className="text-xs mb-1" style={{ color: "#7E908A" }}>{m.phone}</div>
        <div className="text-[11px]" style={{ color: "#7E908A" }}>{m.sport}</div>
      </div>
      <div style={{ height: 1, background: "#16201B" }} />
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontFamily: GS, fontSize: 18, fontWeight: 400, color: "#F4F8F6", lineHeight: 1, letterSpacing: "-0.01em" }}>{m.bookings}</div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "#7E908A" }}>Bookings</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-medium" style={{ color: "#F4F8F6" }}>{m.lastVisit}</div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "#7E908A" }}>Last visit</div>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [query, setQuery] = useState("");
  const filtered = MEMBERS.filter(
    (m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.phone.includes(query)
  );

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Registered members
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Members</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Registered members · your facility</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-full font-medium"
            style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
            1 Call Live Now
          </div>
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
            <Bell size={16} style={{ color: "#7E908A" }} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #F0AE5A 0%, #E2902F 100%)", color: "#1A0D00", boxShadow: "0 4px 16px rgba(236,161,75,0.25)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}>
            <Plus size={15} />Add Member
          </button>
        </div>
      </div>

      <div className="flex-1 px-9 py-7 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-sm"
            style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
            <Search size={15} style={{ color: "#7E908A" }} />
            <input type="text" placeholder="Search members…" value={query} onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder-[#7E908A]" style={{ color: "#F4F8F6" }} />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {[{ label: "Total", value: "142" }, { label: "Active", value: "98" }, { label: "Groups", value: "6" }].map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
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
            {filtered.map((m) => <MemberCard key={m.id} m={m} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl text-sm gap-2"
            style={{ background: "#0E1714", border: "1px solid #1B2722", color: "#7E908A" }}>
            <Users size={28} style={{ color: "#1B2722" }} />
            No members match &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
