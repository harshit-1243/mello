import { Bell, Plus } from "lucide-react";
import { getMembers } from "@/lib/dashboard/data";
import { MembersView } from "./MembersView";

const GS = "var(--font-geist-sans)";

export default async function MembersPage() {
  const { members, groups } = await getMembers();

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Registered members
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Members</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Members Mello recognises on calls · groups enforce booking rules</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
            <Bell size={16} style={{ color: "#7E908A" }} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #F0AE5A 0%, #E2902F 100%)", color: "#1A0D00", boxShadow: "0 4px 16px rgba(236,161,75,0.25)" }}>
            <Plus size={15} />Add Member
          </button>
        </div>
      </div>

      <MembersView members={members} groups={groups} />
    </div>
  );
}
