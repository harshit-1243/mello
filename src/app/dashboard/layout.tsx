import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { getOverview } from "@/lib/dashboard/data";
import { requireDashboardAccess } from "@/lib/dashboard/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireDashboardAccess();
  const { facilityName, facilityCity } = await getOverview();

  return (
    <div className="flex min-h-dvh" style={{ background: "#0E0A1E", color: "#F3F1FB" }}>
      <Sidebar facilityName={facilityName} facilityCity={facilityCity} userEmail={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
