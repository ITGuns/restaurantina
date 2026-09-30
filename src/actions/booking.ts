"use server";

import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Reservation } from "@/db/schema";
import { clientKey } from "@/lib/auth";
import { computeAvailability, generateConfirmationCode, getAvailability, getBookableDates, loadAvailabilityContext, type AvailabilityResult } from "@/lib/booking";
import { getClock } from "@/lib/availability";
import { getReservationByCode } from "@/lib/data/reservations";
import { readBookingSettings } from "@/lib/data/restaurant";
import { toMinutes } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, reservationInput, type ReservationInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { reservations } = schema;

export type PublicReservation = Pick<Reservation, "confirmationCode" | "firstName" | "lastName" | "email" | "phone" | "partySize" | "date" | "time" | "occasion" | "specialRequests" | "status" | "createdAt"> & {
  manageToken: string;
};

const toPublic = (r: Reservation): PublicReservation => ({
  confirmationCode: r.confirmationCode,
  manageToken: r.manageToken,
  firstName: r.firstName,
  lastName: r.lastName,
  email: r.email,
  phone: r.phone,
  partySize: r.partySize,
  date: r.date,
  time: r.time,
  occasion: r.occasion,
  specialRequests: r.specialRequests,
  status: r.status,
  createdAt: r.createdAt,
});

export async function fetchSlots(date: string, partySize: number): Promise<AvailabilityResult> {
  const key = await clientKey();
  const rl = rateLimit(`slots:${key}`, 120, 60_000);
  if (!rl.ok) return { ok: false, code: "invalid_date", message: "Too many requests. Please slow down." };
  return getAvailability(String(date), Number(partySize));
}

export async function fetchBookableDates() {
  return getBookableDates();
}

/**
 * Creates a reservation. Everything is re-validated on the server: the date/time
 * must be offered, open and under capacity at the moment of insert (checked inside
 * a per-date advisory lock), the guest can't double-book the same slot, and a
 * repeated submission with the same idempotency key returns the same reservation.
 */
export async function createReservation(raw: ReservationInput): Promise<ActionResult<PublicReservation>> {
  const key = await clientKey();
  const rl = rateLimit(`reserve:${key}`, 6, 10 * 60_000);
  if (!rl.ok) return fail(`Too many reservation attempts. Please try again in ${Math.ceil(rl.retryAfterSec / 60)} min.`, { code: "rate_limited" });

  const parsed = reservationInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const input = parsed.data;

  const [existing] = await db.select().from(reservations).where(eq(reservations.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing) return { ok: true, data: toPublic(existing) };

  try {
    const created = await db.transaction(async (tx) => {
      // Serialize bookings per date so two guests can't take the last seat.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`reservations:${input.date}`}))`);
      const ctx = await loadAvailabilityContext(input.date, tx);
      const avail = computeAvailability(input.date, input.partySize, ctx);
      if (!avail.ok) throw new BookingError(avail.message, avail.code);
      const slot = avail.slots.find((s) => s.time === input.time);
      if (!slot) throw new BookingError("That time isn't offered on this date. Please pick another time.", "bad_slot");
      if (!slot.available) {
        throw new BookingError(
          slot.reason === "full" ? "That reservation time is no longer available. Please try another time." : "That time has passed. Please choose a later time.",
          "unavailable",
        );
      }

      const [dup] = await tx
        .select({ id: reservations.id })
        .from(reservations)
        .where(
          and(
            eq(reservations.email, input.email.toLowerCase()),
            eq(reservations.date, input.date),
            eq(reservations.time, input.time),
            inArray(reservations.status, ["pending", "confirmed"]),
          ),
        )
        .limit(1);
      if (dup) throw new BookingError("You already have a reservation at this time. Use the link from your original confirmation to view or change it, or call us.", "duplicate");

      const status = ctx.settings.autoConfirm && input.partySize < ctx.settings.largePartyThreshold ? "confirmed" : "pending";
      const manageToken = randomBytes(16).toString("hex");
      const [inserted] = await tx
        .insert(reservations)
        .values({
          confirmationCode: `TMP-${manageToken}`,
          manageToken,
          idempotencyKey: input.idempotencyKey,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          partySize: input.partySize,
          date: input.date,
          time: input.time,
          occasion: input.occasion ?? null,
          specialRequests: input.specialRequests ?? null,
          status,
          source: "web",
        })
        .returning();
      const confirmationCode = generateConfirmationCode(inserted.id);
      await tx.update(reservations).set({ confirmationCode }).where(eq(reservations.id, inserted.id));
      return { ...inserted, confirmationCode };
    });
    return { ok: true, data: toPublic(created) };
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, { code: err.code });
    console.error("createReservation failed", err);
    return fail("We couldn't complete the reservation. Please try again.", { code: "server" });
  }
}

export async function lookupReservation(code: string, token: string): Promise<ActionResult<PublicReservation>> {
  const r = await getReservationByCode(code);
  if (!r || r.manageToken !== token) return fail("We couldn't find that reservation.", { code: "not_found" });
  return { ok: true, data: toPublic(r) };
}

export async function cancelReservation(code: string, token: string): Promise<ActionResult<PublicReservation>> {
  const r = await getReservationByCode(code);
  if (!r || r.manageToken !== token) return fail("We couldn't find that reservation.", { code: "not_found" });
  if (r.status === "cancelled") return { ok: true, data: toPublic(r) };
  if (r.status !== "pending" && r.status !== "confirmed") return fail("This reservation can no longer be cancelled online.", { code: "locked" });
  const clock = getClock((await readBookingSettings()).timezone);
  if (r.date < clock.date || (r.date === clock.date && toMinutes(r.time) <= clock.minutes)) {
    return fail("This reservation time has already passed. Please call us if you need help.", { code: "past" });
  }
  const [updated] = await db
    .update(reservations)
    .set({ status: "cancelled", updatedAt: new Date().toISOString() })
    .where(eq(reservations.id, r.id))
    .returning();
  return { ok: true, data: toPublic(updated) };
}

class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}
