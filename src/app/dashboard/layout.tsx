import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { LiveRail } from "@/components/dashboard/LiveRail";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { getOverview } from "@/lib/dashboard/data";
import { requireDashboardAccess } from "@/lib/dashboard/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// Applies the saved theme to #dash-root before paint (no flash). Default = dark.
const NO_FLASH = `(function(){try{var t=localStorage.getItem('mello-theme');var r=document.getElementById('dash-root');if(t&&r)r.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Authoritative auth gate (redirects if signed out / not linked to a facility).
  // No-op when auth isn't configured yet, so demo/seed mode stays open.
  const { email } = await requireDashboardAccess();

  // Facility + live-call data for the persistent shell (sidebar + live rail).
  const { facilityName, facilityCity, live } = await getOverview();

  return (
    <div id="dash-root" data-theme="dark" suppressHydrationWarning className="flex min-h-dvh bg-paper text-ink">
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      <Sidebar facilityName={facilityName} facilityCity={facilityCity} userEmail={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <LiveRail live={live} />
        <main className="flex-1 px-9 pb-12 pt-7">{children}</main>
      </div>
      <div className="fixed right-6 top-5 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}
