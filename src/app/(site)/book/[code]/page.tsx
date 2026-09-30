import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lookupReservation } from "@/actions/booking";
import { ManageReservation } from "@/components/booking/ManageReservation";
import { featuredPhone, getBookingSettings, getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Your Reservation", robots: { index: false, follow: false } };

export default async function ReservationPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ code }, { t }, settings, restaurant] = await Promise.all([params, searchParams, getBookingSettings(), getRestaurant()]);
  const res = t ? await lookupReservation(code, t) : null;
  if (!res?.ok) notFound();

  return (
    <section className="bg-cream-100 pb-32 pt-32 text-brown-900 md:pt-40">
      <div className="container-site">
        <ManageReservation reservation={res.data} token={t!} restaurant={{ name: restaurant.name, addressLine1: restaurant.addressLine1, city: restaurant.city, state: restaurant.state, zip: restaurant.zip, phone: featuredPhone(restaurant) }} turnTime={settings.turnTimeMinutes} timezone={settings.timezone} />
      </div>
    </section>
  );
}
