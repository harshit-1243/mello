import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { LiveRail } from "@/components/dashboard/LiveRail";
import { getOverview } from "@/lib/dashboard/data";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Facility + live-call data for the persistent shell (sidebar + live rail).
  const { facilityName, facilityCity, live } = await getOverview();

  return (
    <div className="flex min-h-dvh bg-paper text-ink">
      <Sidebar facilityName={facilityName} facilityCity={facilityCity} />
      <div className="flex min-w-0 flex-1 flex-col">
        <LiveRail live={live} />
        <main className="flex-1 px-9 pb-12 pt-7">{children}</main>
      </div>
    </div>
  );
}
