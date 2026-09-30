import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/toast";
import { requireAdminPage } from "@/lib/auth";
import { getClock } from "@/lib/availability";
import { dashboardStats } from "@/lib/data/reservations";
import { readBookingSettings, readRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | RestauranTina Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const [settings, restaurant] = await Promise.all([readBookingSettings(), readRestaurant()]);
  const clock = getClock(settings.timezone);
  const { pendingCount } = await dashboardStats(clock.date);
  const attention = (restaurant.phoneConfirmed ? 0 : 1) + (restaurant.hoursConfirmed ? 0 : 1);
  return (
    <div className="admin-body flex min-h-screen flex-col lg:flex-row">
      <ToastProvider>
        <Sidebar user={{ name: session.name, email: session.email }} pendingCount={pendingCount} attention={attention} brand={restaurant.name} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </ToastProvider>
    </div>
  );
}
