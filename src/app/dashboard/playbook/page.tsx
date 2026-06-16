"use client";

import { useState } from "react";
import { Bell, Clock, Dumbbell, IndianRupee, Lock, Users, Shuffle, CreditCard, X, Check } from "lucide-react";

const GS = "var(--font-geist-sans)";

interface Rule {
  id: string;
  icon: React.ElementType;
  title: string;
  label: string;
  value: string;
  active: boolean;
}

const INITIAL_RULES: Rule[] = [
  { id: "hours",          icon: Clock,       title: "Operating Hours",       label: "Mello answers calls within this window only",     value: "8:00 AM – 12:00 AM, all week",                        active: true },
  { id: "courts",         icon: Dumbbell,    title: "Sports & Courts",       label: "Available courts mello can book",                 value: "Badminton ×3, Pickleball ×2, Box Cricket ×1",         active: true },
  { id: "pricing",        icon: IndianRupee, title: "Pricing",               label: "Default rates communicated on call",              value: "Badminton ₹600/hr · Non-member · Members free",       active: true },
  { id: "member-windows", icon: Lock,        title: "Member-Only Windows",   label: "Slots reserved exclusively for members",          value: "8–10 AM & 9–11 PM · released 30 min prior",          active: true },
  { id: "group-conflict", icon: Users,       title: "Group Conflict Rule",   label: "Blocks back-to-back group bookings",              value: "±2 hours, same sport, same group",                    active: true },
  { id: "court-assign",   icon: Shuffle,     title: "Court Assignment",      label: "How courts are allocated",                        value: "Auto-assigned · never spoken on call",                active: true },
  { id: "payment",        icon: CreditCard,  title: "Payment",               label: "How customers pay for bookings",                  value: "Razorpay link via WhatsApp, or pay-at-venue",         active: true },
  { id: "cancellation",   icon: X,           title: "Cancellation",          label: "Free cancellation policy window",                 value: "Free up to 2 hrs before slot",                        active: true },
];

function RuleCard({ rule, onSave }: { rule: Rule; onSave: (id: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule.value);
  const Icon = rule.icon;

  function handleSave() {
    if (draft.trim()) onSave(rule.id, draft.trim());
    setEditing(false);
  }
  function handleCancel() { setDraft(rule.value); setEditing(false); }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-150"
      style={{ background: "#0E1714", border: editing ? "1px solid rgba(52,211,153,0.3)" : "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ background: rule.active ? "#34D399" : "#7E908A" }} />
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.14)" }}>
            <Icon size={14} style={{ color: "#34D399" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: "#F4F8F6" }}>{rule.title}</span>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs transition-opacity shrink-0" style={{ color: "#34D399" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.65")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.25)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(52,211,153,0.25)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(52,211,153,0.15)")}>
              <Check size={12} style={{ color: "#34D399" }} />
            </button>
            <button onClick={handleCancel} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={{ background: "rgba(126,144,138,0.1)", border: "1px solid #1B2722" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(126,144,138,0.2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(126,144,138,0.1)")}>
              <X size={12} style={{ color: "#7E908A" }} />
            </button>
          </div>
        )}
      </div>
      <div className="text-xs" style={{ color: "#7E908A" }}>{rule.label}</div>
      <div style={{ height: 1, background: "#16201B" }} />
      {editing ? (
        <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); } if (e.key === "Escape") handleCancel(); }}
          rows={2} className="w-full bg-transparent text-sm outline-none resize-none"
          style={{ color: "#F4F8F6", caretColor: "#34D399", fontFamily: "var(--font-inter)" }} />
      ) : (
        <p className="text-sm font-medium leading-relaxed" style={{ color: "#F4F8F6" }}>{rule.value}</p>
      )}
    </div>
  );
}

export default function PlaybookPage() {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Rules &amp; Behaviour
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Playbook</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>The rules Mello follows on every call.</p>
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

      <div className="px-9 py-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs" style={{ color: "#7E908A" }}>{rules.filter((r) => r.active).length} rules active</span>
          <div style={{ flex: 1, height: 1, background: "#16201B" }} />
          <span className="text-xs" style={{ color: "#7E908A" }}>
            Click <span style={{ color: "#34D399" }}>Edit</span> on any card to update a rule · changes apply instantly
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} onSave={(id, value) => setRules((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)))} />
          ))}
        </div>
      </div>
    </div>
  );
}
