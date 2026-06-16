"use client";

import { useState } from "react";
import { Bell, Play, ChevronDown, Save, Clock, Dumbbell, IndianRupee, Lock, Users, Shuffle, CreditCard, X, Check } from "lucide-react";

const GS = "var(--font-geist-sans)";

type Section = "Facility" | "Sports & Pricing" | "Members" | "Payments" | "WhatsApp" | "Voice" | "Team" | "Data & Privacy";
const SECTIONS: Section[] = ["Facility", "Sports & Pricing", "Members", "Payments", "WhatsApp", "Voice", "Team", "Data & Privacy"];

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "#7E908A" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: "#0A120E", border: "1px solid #1B2722", color: "#F4F8F6", caretColor: "#34D399" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.4)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#1B2722")} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "#7E908A" }}>{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: "#0A120E", border: "1px solid #1B2722", color: "#F4F8F6", cursor: "pointer" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.4)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1B2722")}>
          {options.map((o) => <option key={o} value={o} style={{ background: "#0A120E" }}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#7E908A" }} />
      </div>
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4" style={{ borderBottom: "1px solid #16201B" }}>
      <div>
        <div className="text-sm font-medium" style={{ color: "#F4F8F6" }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: "#7E908A" }}>{sub}</div>
      </div>
      <button onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
        className="relative shrink-0 rounded-full transition-all duration-200"
        style={{ background: checked ? "#34D399" : "#1B2722", width: 40, height: 22 }}>
        <span className="absolute top-0.5 rounded-full transition-all duration-200"
          style={{ width: 18, height: 18, background: checked ? "#07100C" : "#7E908A", left: checked ? 20 : 2, boxShadow: checked ? "0 0 6px rgba(52,211,153,0.4)" : "none" }} />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.12em] shrink-0" style={{ color: "#7E908A" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "#16201B" }} />
    </div>
  );
}

function FacilityForm() {
  const [name, setName] = useState("Smash Arena");
  const [address, setAddress] = useState("Andheri W, Mumbai");
  const [hoursFrom, setHoursFrom] = useState("8:00 AM");
  const [hoursTo, setHoursTo] = useState("12:00 AM");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST, UTC+5:30)");
  const [afterHours, setAfterHours] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);
  const [payments, setPayments] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);

  const TIMEZONES = ["Asia/Kolkata (IST, UTC+5:30)", "Asia/Dubai (GST, UTC+4)", "Europe/London (GMT, UTC+0)", "America/New_York (EST, UTC-5)", "America/Los_Angeles (PST, UTC-8)"];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-medium" style={{ color: "#F4F8F6" }}>Facility</div>
          <div className="text-xs mt-0.5" style={{ color: "#7E908A" }}>Basic information mello uses to introduce your space.</div>
        </div>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: saved ? "rgba(52,211,153,0.15)" : "linear-gradient(135deg, #F0AE5A 0%, #E2902F 100%)", color: saved ? "#34D399" : "#1A0D00", boxShadow: saved ? "none" : "0 4px 16px rgba(236,161,75,0.25)", border: saved ? "1px solid rgba(52,211,153,0.3)" : "1px solid transparent" }}>
          {saved ? <>Saved ✓</> : <><Save size={14} />Save Changes</>}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Basic Info</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Facility Name" value={name} onChange={setName} />
          <Field label="Address" value={address} onChange={setAddress} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "#7E908A" }}>Operating Hours</label>
            <div className="flex items-center gap-2">
              <input type="text" value={hoursFrom} onChange={(e) => setHoursFrom(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0A120E", border: "1px solid #1B2722", color: "#F4F8F6" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1B2722")} />
              <span className="text-xs shrink-0" style={{ color: "#7E908A" }}>to</span>
              <input type="text" value={hoursTo} onChange={(e) => setHoursTo(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#0A120E", border: "1px solid #1B2722", color: "#F4F8F6" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1B2722")} />
            </div>
          </div>
          <SelectField label="Timezone" value={timezone} options={TIMEZONES} onChange={setTimezone} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Voice</SectionLabel>
        <div className="flex items-center justify-between px-4 py-4 rounded-xl"
          style={{ background: "#0A120E", border: "1px solid #1B2722" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-[3px] h-8">
              {[5, 10, 16, 9, 20, 12, 7, 18, 11, 6, 14, 8].map((h, i) => (
                <div key={i} className="w-1 rounded-sm transition-all duration-300"
                  style={{ height: playing ? `${h + Math.random() * 6}px` : `${h}px`, background: playing ? "#34D399" : "#7E908A", opacity: playing ? 0.9 : 0.4 }} />
              ))}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "#F4F8F6" }}>ritu</div>
              <div className="text-xs" style={{ color: "#7E908A" }}>Hindi / English · Warm, professional</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>Active Voice</span>
            <button onClick={() => { setPlaying(true); setTimeout(() => setPlaying(false), 2400); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: playing ? "rgba(52,211,153,0.2)" : "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", boxShadow: playing ? "0 0 12px rgba(52,211,153,0.3)" : "none" }}>
              <Play size={12} style={{ color: "#34D399", fill: "#34D399", marginLeft: 1 }} />
            </button>
          </div>
        </div>
        <p className="text-xs" style={{ color: "#7E908A" }}>This is the voice callers hear when mello picks up. Change it in the Voice section.</p>
      </div>

      <div className="flex flex-col gap-0">
        <SectionLabel>Behaviour</SectionLabel>
        <Toggle label="Answer after-hours" sub="Mello picks up calls outside your operating hours" checked={afterHours} onChange={setAfterHours} />
        <Toggle label="Send WhatsApp confirmations" sub="Booking confirmations sent via WhatsApp after every call" checked={whatsapp} onChange={setWhatsapp} />
        <Toggle label="Take Razorpay payments" sub="Send payment links during the call for immediate collection" checked={payments} onChange={setPayments} />
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <SectionLabel>Data & Privacy</SectionLabel>
        <div className="rounded-xl px-5 py-4 flex items-start justify-between gap-4"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <div>
            <div className="text-sm font-medium mb-1" style={{ color: "#F87171" }}>Delete all facility data</div>
            <div className="text-xs leading-relaxed" style={{ color: "#7E908A" }}>
              Permanently removes all bookings, member records, call logs, and AI settings for your facility. This action cannot be undone.
            </div>
          </div>
          <button className="shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.5)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}>
            Delete data
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("Facility");

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Configuration
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Settings</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Configure how mello behaves for your facility.</p>
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
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-52 shrink-0 flex flex-col py-6 px-3 gap-0.5" style={{ borderRight: "1px solid #16201B" }}>
          {SECTIONS.map((s) => {
            const isActive = s === activeSection;
            const isDanger = s === "Data & Privacy";
            return (
              <button key={s} onClick={() => setActiveSection(s)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={{ background: isActive ? "rgba(52,211,153,0.1)" : "transparent", color: isActive ? "#34D399" : isDanger ? "#F87171" : "#7E908A", fontWeight: isActive ? 500 : 400, border: isActive ? "1px solid rgba(52,211,153,0.18)" : "1px solid transparent" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                {s}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto p-8">
          <div className="rounded-2xl p-7 max-w-2xl"
            style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.3)" }}>
            {activeSection === "Facility" ? <FacilityForm /> : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#16201B", border: "1px solid #1B2722" }}>
                  <span style={{ color: "#7E908A", fontSize: 18 }}>✦</span>
                </div>
                <p className="text-sm" style={{ color: "#7E908A" }}>{activeSection} settings coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
