import Link from "next/link";

export default function ReservationNotFound() {
  return (
    <section className="flex min-h-[60svh] flex-col items-center justify-center bg-cream-100 px-6 pb-24 pt-40 text-center text-brown-900">
      <p className="eyebrow text-clay-600">Reservation</p>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">We couldn&apos;t find that reservation.</h1>
      <p className="mt-4 max-w-md text-brown-700">Check the link from your confirmation, or call the restaurant and we&apos;ll look it up for you.</p>
      <Link href="/book" className="mt-8 rounded-full bg-clay-600 px-6 py-3 font-semibold text-cream-50 hover:bg-clay-500">
        Make a new reservation
      </Link>
    </section>
  );
}
