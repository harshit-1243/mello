import { Bell, Plus } from "lucide-react";
import { getMembers } from "@/lib/dashboard/data";
import { MembersView } from "./MembersView";

const GS = "var(--font-geist-sans)";

export default async function MembersPage() {
  const { members, groups } = await getMembers();

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #20183C" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#8C86A8" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#8C86A8" }} />
            Registered members
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F3F1FB", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Members</h1>
          <p className="mt-2 text-sm" style={{ color: "#8C86A8" }}>Members Mello recognises on calls · groups enforce booking rules</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#181030", border: "1px solid #2A2348" }}>
            <Bell size={16} style={{ color: "#8C86A8" }} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #A78BFA 0%, #6A4FD0 100%)", color: "#0C0820", boxShadow: "0 4px 16px rgba(167,139,250,0.3)" }}>
            <Plus size={15} />Add Member
          </button>
        </div>
      </div>

      <MembersView members={members} groups={groups} />
    </div>
  );
}
