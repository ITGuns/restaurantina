import type { Metadata } from "next";
import { ReservationsHeaderLink, ReservationsView, type Filters } from "@/components/admin/reservations/ReservationsView";
import { PageHeader } from "@/components/admin/ui";
import { getClock } from "@/lib/availability";
import { listReservations, reservationCountsByDate } from "@/lib/data/reservations";
import { readBookingSettings } from "@/lib/data/restaurant";
import type { ReservationStatus } from "@/db/schema";

export const metadata: Metadata = { title: "Reservations" };

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const settings = await readBookingSettings();
  const clock = getClock(settings.timezone);
  const view = (["list", "calendar", "day"].includes(sp.view ?? "") ? sp.view : "list") as Filters["view"];
  const filters: Filters = {
    view,
    date: sp.date ?? clock.date,
    month: sp.month ?? clock.date.slice(0, 7),
    status: sp.status ?? "active",
    q: sp.q ?? "",
    from: sp.from ?? (view === "list" && !sp.q ? clock.date : ""),
    to: sp.to ?? "",
  };

  let reservations = [] as Awaited<ReturnType<typeof listReservations>>;
  if (view === "list") {
    reservations = await listReservations({ q: filters.q || undefined, status: (filters.status as ReservationStatus | "active" | "all") || "active", from: filters.from || undefined, to: filters.to || undefined });
  } else if (view === "day") {
    reservations = await listReservations({ date: filters.date, status: "all" });
  }

  const [y, m] = filters.month.split("-").map(Number);
  const monthStart = `${filters.month}-01`;
  const monthEnd = `${filters.month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  const monthCounts = view === "calendar" ? await reservationCountsByDate(monthStart, monthEnd) : {};

  return (
    <>
      <PageHeader title="Reservations" description="Confirm, seat, and manage every booking." actions={<ReservationsHeaderLink />} />
      <ReservationsView reservations={reservations} filters={filters} today={clock.date} monthCounts={monthCounts} occasions={settings.occasions} />
    </>
  );
}
