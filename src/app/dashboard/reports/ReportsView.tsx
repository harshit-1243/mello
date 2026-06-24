"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import type { ReportData } from "@/lib/dashboard/data";
import { rupees } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";
const GRID = "#20183C";
const TICK = "#8C86A8";
const CYAN = "#34D6E0";
const VIOLET = "#A78BFA";

function hourLabel(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr} ${ampm}`;
}

function KpiTile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="flex-1 rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}>
      <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#8C86A8" }}>{label}</span>
      <div style={{ fontFamily: GS, fontSize: 44, fontWeight: 400, color: accent ?? "#F3F1FB", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs" style={{ color: "#8C86A8" }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}>
      <div className="text-sm font-medium" style={{ color: "#F3F1FB" }}>{title}</div>
      <div className="flex-1">{children}</div>
      {caption && <p className="text-xs leading-relaxed" style={{ color: "#8C86A8" }}>{caption}</p>}
    </div>
  );
}

export function ReportsView({ data }: { data: ReportData }) {
  const byHour = data.byHour.map((d) => ({ ...d, label: hourLabel(d.hour) }));
  const peakHour = byHour.reduce((m, d) => (d.count > m.count ? d : m), byHour[0] ?? { hour: -1, count: 0 });
  const sportMax = Math.max(1, ...data.bySport.map((s) => s.count));
  const totalMix = data.memberMix.member + data.memberMix.nonMember;
  const memberPct = totalMix ? Math.round((data.memberMix.member / totalMix) * 100) : 0;
  const nonMemberPct = 100 - memberPct;

  return (
    <div className="px-9 py-7 space-y-5">
      {/* KPI row */}
      <div className="flex gap-4">
        <KpiTile label="Call → Booking" value={`${data.conversionPct}%`} sub={`${data.bookings} of ${data.calls} calls`} />
        <KpiTile label="Answer Rate" value={`${data.answerRatePct}%`} sub={`${data.answered} of ${data.calls} answered`} />
        <KpiTile label="After-Hours Calls" value={String(data.afterHoursCalls)} sub="caught outside open hours" />
        <KpiTile label="Revenue Booked" value={rupees(data.revenueInr)} sub={`non-member · last ${data.periodDays} days`} accent="#34D6E0" />
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Demand by Hour" caption="Booking starts by hour — your real peak windows.">
          {byHour.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm" style={{ color: "#8C86A8" }}>No bookings in this period yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byHour} barSize={16} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {byHour.map((d, i) => <Cell key={i} fill={d.hour === peakHour.hour ? VIOLET : CYAN} fillOpacity={d.hour === peakHour.hour ? 1 : 0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Bookings by Sport">
          {data.bySport.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm" style={{ color: "#8C86A8" }}>No bookings yet.</div>
          ) : (
            <div className="flex flex-col gap-3 py-1">
              {data.bySport.map((d) => (
                <div key={d.sport} className="flex items-center gap-3">
                  <span className="text-xs w-28 shrink-0 text-right" style={{ color: "#8C86A8" }}>{d.sport}</span>
                  <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: "#20183C" }}>
                    <div className="h-full rounded-sm transition-all" style={{ width: `${(d.count / sportMax) * 100}%`, background: CYAN, opacity: 0.85 }} />
                  </div>
                  <span className="text-xs w-6 text-right shrink-0" style={{ color: "#F3F1FB", fontVariantNumeric: "tabular-nums" }}>{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Member vs Non-member">
          <div className="flex flex-col gap-5 py-2">
            <div className="flex items-end justify-between">
              <div>
                <div style={{ fontFamily: GS, fontSize: 48, fontWeight: 400, color: VIOLET, lineHeight: 1, letterSpacing: "-0.02em" }}>{memberPct}%</div>
                <div className="text-xs mt-1" style={{ color: "#8C86A8" }}>Member bookings</div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: GS, fontSize: 48, fontWeight: 400, color: "#8C86A8", lineHeight: 1, letterSpacing: "-0.02em" }}>{nonMemberPct}%</div>
                <div className="text-xs mt-1" style={{ color: "#8C86A8" }}>Non-member</div>
              </div>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: "#20183C" }}>
              <div className="h-full rounded-l-full" style={{ width: `${memberPct}%`, background: VIOLET, opacity: 0.85 }} />
              <div className="h-full rounded-r-full" style={{ width: `${nonMemberPct}%`, background: "#2A2348" }} />
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: "#8C86A8" }}>
              <span><span style={{ color: "#F3F1FB", fontWeight: 600 }}>{data.memberMix.member}</span> by members</span>
              <span><span style={{ color: "#F3F1FB", fontWeight: 600 }}>{data.memberMix.nonMember}</span> by non-members</span>
            </div>
          </div>
        </ChartCard>

        {data.baseline ? (
          <ChartCard title="Before vs After Mello">
            <div className="flex items-stretch gap-6 py-2">
              <div className="flex-1 rounded-xl p-4 flex flex-col gap-2" style={{ background: "#0E0A1E", border: "1px solid #20183C" }}>
                <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#8C86A8" }}>Before Mello</div>
                <div style={{ fontFamily: GS, fontSize: 52, fontWeight: 400, color: "#8C86A8", lineHeight: 1, letterSpacing: "-0.02em" }}>{data.baseline.missedPerMonth}</div>
                <div className="text-xs" style={{ color: "#8C86A8" }}>missed calls / month</div>
              </div>
              <div className="flex-1 rounded-xl p-4 flex flex-col gap-2" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)" }}>
                <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#A78BFA" }}>With Mello</div>
                <div style={{ fontFamily: GS, fontSize: 52, fontWeight: 400, color: VIOLET, lineHeight: 1, letterSpacing: "-0.02em" }}>{data.answered}</div>
                <div className="text-xs" style={{ color: "#8C86A8" }}>calls answered (last {data.periodDays}d)</div>
              </div>
            </div>
          </ChartCard>
        ) : (
          <ChartCard title="Calls Answered" caption={`Across the last ${data.periodDays} days.`}>
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: VIOLET, lineHeight: 1, letterSpacing: "-0.02em" }}>{data.answered}</div>
              <div className="text-xs" style={{ color: "#8C86A8" }}>of {data.calls} total calls · {data.answerRatePct}% answered</div>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
