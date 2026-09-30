import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservationDetail } from "@/components/admin/reservations/ReservationDetail";
import { PageHeader } from "@/components/admin/ui";
import { getReservationById } from "@/lib/data/reservations";
import { readBookingSettings } from "@/lib/data/restaurant";
import { longDate, time12 } from "@/lib/format";

export const metadata: Metadata = { title: "Reservation" };

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) notFound();
  const [reservation, settings] = await Promise.all([getReservationById(numeric), readBookingSettings()]);
  if (!reservation) notFound();
  return (
    <>
      <PageHeader
        title={`${reservation.firstName} ${reservation.lastName}`}
        description={`${reservation.confirmationCode} · ${longDate(reservation.date, { weekday: true, year: true })} at ${time12(reservation.time)} · party of ${reservation.partySize}`}
        actions={<Link href="/admin/reservations" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900">← All reservations</Link>}
      />
      <ReservationDetail reservation={reservation} occasions={settings.occasions} />
    </>
  );
}
