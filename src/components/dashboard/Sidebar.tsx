"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoOrb } from "@/components/ui/LogoOrb";
import { LogoutButton } from "./LogoutButton";
import {
  LayoutDashboard,
  PhoneCall,
  CalendarDays,
  Users,
  BookOpen,
  FlaskConical,
  BarChart2,
  Settings,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview",   href: "/dashboard",          exact: true },
  { icon: PhoneCall,       label: "Live Calls", href: "/dashboard/calls"                },
  { icon: CalendarDays,    label: "Bookings",   href: "/dashboard/bookings"             },
  { icon: Users,           label: "Members",    href: "/dashboard/members"              },
  { icon: BookOpen,        label: "Playbook",   href: "/dashboard/playbook"             },
  { icon: FlaskConical,    label: "Test Mello", href: "/dashboard/test"                 },
  { icon: BarChart2,       label: "Reports",    href: "/dashboard/reports"              },
  { icon: Settings,        label: "Settings",   href: "/dashboard/settings"             },
];

export function Sidebar({
  facilityName,
  facilityCity,
  userEmail,
}: {
  facilityName: string;
  facilityCity: string;
  userEmail?: string | null;
}) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const initials = facilityName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <aside
      className="flex flex-col h-full w-[248px] shrink-0 sticky top-0 min-h-dvh"
      style={{ background: "#0A120E", borderRight: "1px solid #16201B" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-7 pb-5">
        <LogoOrb size={36} onStage className="shrink-0" />
        <div>
          <div
            className="text-[15px] tracking-tight"
            style={{ color: "#F4F8F6", fontFamily: "var(--font-geist-sans)", fontWeight: 600 }}
          >
            mello.ai
          </div>
          <div
            className="text-[10px] tracking-[0.12em] uppercase"
            style={{ color: "#7E908A" }}
          >
            AI Booking System
          </div>
        </div>
      </div>

      {/* Workspace card */}
      <div className="px-4 pb-3">
        <div
          className="text-[10px] tracking-[0.12em] uppercase mb-2 px-1"
          style={{ color: "#7E908A" }}
        >
          Workspace
        </div>
        <div
          className="rounded-xl px-3 py-3 relative"
          style={{ background: "#0E1714", border: "1px solid #1B2722" }}
        >
          <div
            className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(236,161,75,0.15)",
              color: "#ECA14B",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            PRO
          </div>
          <div className="text-sm" style={{ color: "#F4F8F6", fontWeight: 600 }}>
            {facilityName}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#7E908A" }}>
            {facilityCity}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ icon: Icon, label, href, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <span
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer select-none"
                style={{
                  background: active ? "rgba(52,211,153,0.14)" : "transparent",
                  color: active ? "#34D399" : "#7E908A",
                  fontWeight: active ? 500 : 400,
                  display: "flex",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLSpanElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLSpanElement).style.color = "#B0C4BB";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLSpanElement).style.background = "transparent";
                    (e.currentTarget as HTMLSpanElement).style.color = "#7E908A";
                  }
                }}
              >
                <Icon size={16} style={{ color: active ? "#34D399" : "inherit" }} />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderTop: "1px solid #16201B" }}
      >
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, #5FF0B0 0%, #1E7A55 100%)",
            color: "#07100C",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate" style={{ color: "#F4F8F6", fontWeight: 500 }}>
            {facilityName}
          </div>
          {userEmail && (
            <div className="text-[11px] truncate" style={{ color: "#7E908A" }}>
              {userEmail}
            </div>
          )}
        </div>
        {userEmail && <LogoutButton email={userEmail} />}
      </div>
    </aside>
  );
}
