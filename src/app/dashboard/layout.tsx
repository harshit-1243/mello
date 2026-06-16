import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { LiveRail } from "@/components/dashboard/LiveRail";
import { getOverview } from "@/lib/dashboard/data";
import { requireDashboardAccess } from "@/lib/dashboard/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireDashboardAccess();
  const { facilityName, facilityCity, live } = await getOverview();

  return (
    <div className="flex min-h-dvh" style={{ background: "#0A120E", color: "#F4F8F6" }}>
      <Sidebar facilityName={facilityName} facilityCity={facilityCity} userEmail={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <LiveRail live={live} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
