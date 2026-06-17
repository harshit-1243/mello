import { Bell } from "lucide-react";
import { getReports } from "@/lib/dashboard/data";
import { ReportsView } from "./ReportsView";

const GS = "var(--font-geist-sans)";

export default async function ReportsPage() {
  const data = await getReports();

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Last {data.periodDays} days
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Reports</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Real outcomes — no vanity metrics.</p>
        </div>
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
          <Bell size={16} style={{ color: "#7E908A" }} />
        </button>
      </div>

      <ReportsView data={data} />
    </div>
  );
}
