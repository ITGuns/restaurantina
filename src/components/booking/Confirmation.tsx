"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PublicReservation } from "@/actions/booking";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";
import { SITE_URL } from "@/lib/constants";
import { longDate, time12 } from "@/lib/format";

const STATUS_LABEL = { pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed", no_show: "No-show" } as const;

/** Shown ONLY after the reservation row exists in the database. */
export function Confirmation({ reservation: r, restaurant, turnTime, timezone, heading }: { reservation: PublicReservation; restaurant: { name: string; addressLine1: string; city: string; state: string; zip: string; phone: string }; turnTime: number; timezone: string; heading?: string }) {
  const [origin, setOrigin] = useState(SITE_URL);
  useEffect(() => setOrigin(window.location.origin), []);
  const manageUrl = `${origin}/book/${r.confirmationCode}?t=${r.manageToken}`;
  const event: CalendarEvent = {
    title: `${restaurant.name}: table for ${r.partySize}`,
    description: `Reservation ${r.confirmationCode} for ${r.firstName} ${r.lastName}. Party of ${r.partySize}. ${restaurant.phone}`,
    location: `${restaurant.name}, ${restaurant.addressLine1}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip}`,
    date: r.date,
    time: r.time,
    durationMinutes: turnTime,
    uid: `${r.confirmationCode}@restaurantina`,
    url: manageUrl,
    timezone,
  };
  const pending = r.status === "pending";
  const cancelled = r.status === "cancelled";
  const title = heading ?? (cancelled ? "Reservation cancelled" : pending ? "Reservation requested" : "Reservation confirmed");

  return (
    <div className="mx-auto max-w-xl text-center" role="status" aria-live="polite">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-clay-600 text-cream-50 shadow-glow">
        {cancelled ? (
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }} />
          </svg>
        )}
      </motion.div>
      <p className="mt-6 eyebrow text-clay-600">{restaurant.name}</p>
      <h2 className="mt-3 font-display text-4xl text-brown-900 sm:text-5xl">{title}</h2>
      <p className="mt-3 text-[15px] text-brown-700">
        {cancelled
          ? "We've released your table. We hope to see you another time."
          : r.status === "completed"
            ? "Thanks for dining with us. This reservation is complete."
            : pending
              ? "Your request is in. Larger parties are confirmed by our team, and we'll reach out shortly."
              : "Your table is saved. We look forward to seeing you."}
      </p>

      <div className="mt-8 rounded-[24px] border border-brown-900/10 bg-cream-50 p-6 text-left shadow-card sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="eyebrow text-brown-500">Confirmation number</span>
          <span className="font-display text-2xl tracking-[0.06em] text-brown-900" data-testid="confirmation-code">{r.confirmationCode}</span>
        </div>
        <dl className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="eyebrow text-brown-500">Date</dt>
            <dd className="mt-1 font-display text-xl text-brown-900">{longDate(r.date)}</dd>
          </div>
          <div>
            <dt className="eyebrow text-brown-500">Time</dt>
            <dd className="mt-1 font-display text-xl text-brown-900">{time12(r.time)}</dd>
          </div>
          <div>
            <dt className="eyebrow text-brown-500">Party size</dt>
            <dd className="mt-1 font-display text-xl text-brown-900">{r.partySize} {r.partySize === 1 ? "guest" : "guests"}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-brown-900/10 pt-5 text-[14px] text-brown-700">
          <span className="font-semibold text-brown-900">{r.firstName} {r.lastName}</span>
          <span>·</span>
          <span>{r.email}</span>
          <span>·</span>
          <span>{r.phone}</span>
          <Pill tone={cancelled || r.status === "no_show" ? "clay" : pending ? "mostaza" : "verde"} className="ml-auto">
            {STATUS_LABEL[r.status]}
          </Pill>
        </div>
        {(r.occasion || r.specialRequests) && (
          <div className="mt-4 space-y-1 text-[14px] text-brown-700">
            {r.occasion && <p><span className="font-semibold">Occasion:</span> {r.occasion}</p>}
            {r.specialRequests && <p><span className="font-semibold">Requests:</span> {r.specialRequests}</p>}
          </div>
        )}
      </div>

      {!cancelled && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={googleCalendarUrl(event)} variant="secondary" size="sm">Add to Calendar</ButtonLink>
          <Button variant="outline" size="sm" className="text-brown-900" onClick={() => downloadIcs(event, `restaurantina-${r.confirmationCode}.ics`)}>Download .ics</Button>
          <ButtonLink href={`/book/${r.confirmationCode}?t=${r.manageToken}`} variant="outline" size="sm" className="text-brown-900">View Reservation</ButtonLink>
        </div>
      )}
      {!cancelled && (
        <p className="mt-6 rounded-2xl border border-brown-900/10 bg-cream-100 px-4 py-3 text-[13px] text-brown-700">
          Save this page or bookmark <span className="font-semibold text-brown-900">View Reservation</span>: it&apos;s your private link to check or cancel the booking.
        </p>
      )}
      <p className="mt-6 text-[13px] text-brown-500">
        Need to change something? Call us at <a href={`tel:+1${restaurant.phone.replace(/\D/g, "")}`} className="font-semibold text-brown-900">{restaurant.phone}</a>.
      </p>
      <Link href="/" className="mt-4 inline-block text-[14px] font-semibold text-clay-600 hover:underline">← Back to Home</Link>
    </div>
  );
}
