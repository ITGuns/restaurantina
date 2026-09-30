import "server-only";
import { and, asc, eq, gte } from "drizzle-orm";
import { db, schema, type DbLike } from "@/db";
import type { BookingSettings, BookingWindow, DateOverride, Reservation } from "@/db/schema";
import { readBookingSettings } from "./data/restaurant";
import { getReservationsForDate } from "./data/reservations";
import { getClock, type Clock } from "./availability";
import { addDays, dayOfWeek, fromMinutes, longDate, time12, toMinutes } from "./format";

const { bookingWindows, dateOverrides } = schema;

export type SlotInfo = {
  time: string;
  label: string;
  available: boolean;
  reason?: "full" | "lead" | "past";
};

export type AvailabilityResult =
  | { ok: true; date: string; slots: SlotInfo[]; note: string | null; label: string | null }
  | { ok: false; code: "disabled" | "invalid_date" | "past" | "too_far" | "closed" | "party_size"; message: string };

export type AvailabilityContext = {
  settings: BookingSettings;
  windows: BookingWindow[];
  override: DateOverride | undefined;
  reservations: Reservation[];
  clock: Clock;
};

/** Pure slot computation: no I/O, easy to test. */
export function computeAvailability(date: string, partySize: number, ctx: AvailabilityContext): AvailabilityResult {
  const { settings, clock } = ctx;
  if (!settings.bookingsEnabled) {
    return { ok: false, code: "disabled", message: "Online reservations are paused right now. Please call us to book." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, code: "invalid_date", message: "Please choose a valid date." };
  if (date < clock.date) return { ok: false, code: "past", message: "That date has already passed. Please choose another day." };
  if (date > addDays(clock.date, settings.maxDaysInAdvance)) {
    return { ok: false, code: "too_far", message: `We accept reservations up to ${settings.maxDaysInAdvance} days in advance.` };
  }
  if (!Number.isInteger(partySize) || partySize < settings.minPartySize || partySize > settings.maxPartySize) {
    return {
      ok: false,
      code: "party_size",
      message: `We can seat parties of ${settings.minPartySize} to ${settings.maxPartySize} online. For larger groups, please call us.`,
    };
  }

  let windows: { start: number; end: number; label: string | null }[] = [];
  let note: string | null = null;
  if (ctx.override) {
    if (ctx.override.closed) {
      return {
        ok: false,
        code: "closed",
        message: ctx.override.reason
          ? `We're closed on ${longDate(date)} (${ctx.override.reason}). Please choose another day.`
          : `We're closed on ${longDate(date)}. Please choose another day.`,
      };
    }
    if (ctx.override.startTime && ctx.override.endTime) {
      windows = [{ start: toMinutes(ctx.override.startTime), end: toMinutes(ctx.override.endTime), label: ctx.override.reason }];
      note = ctx.override.reason ? `Special hours: ${ctx.override.reason}` : "Special hours today";
    }
  }
  if (!windows.length) {
    const dow = dayOfWeek(date);
    windows = ctx.windows
      .filter((w) => w.active && w.dayOfWeek === dow)
      .map((w) => ({ start: toMinutes(w.startTime), end: toMinutes(w.endTime), label: w.label }));
  }
  if (!windows.length) {
    return { ok: false, code: "closed", message: "We're closed on this date. Please choose another day." };
  }

  const active = ctx.reservations.filter((r) => r.status === "pending" || r.status === "confirmed");
  const turn = settings.turnTimeMinutes;
  const slots: SlotInfo[] = [];
  const seen = new Set<string>();

  for (const w of windows.sort((a, b) => a.start - b.start)) {
    for (let m = w.start; m <= w.end; m += settings.slotIntervalMinutes) {
      const time = fromMinutes(m);
      if (seen.has(time)) continue;
      seen.add(time);

      let reason: SlotInfo["reason"] | undefined;
      if (date === clock.date) {
        if (m < clock.minutes) reason = "past";
        else if (m < clock.minutes + settings.minLeadTimeMinutes) reason = "lead";
      }
      if (!reason) {
        const overlapping = active.filter((r) => Math.abs(toMinutes(r.time) - m) < turn);
        const covers = overlapping.reduce((n, r) => n + r.partySize, 0);
        if (overlapping.length >= settings.maxBookingsPerSlot || covers + partySize > settings.maxCoversPerSlot) reason = "full";
      }
      slots.push({ time, label: time12(time), available: !reason, reason });
    }
  }

  const label = windows.length === 1 ? windows[0].label : null;
  return { ok: true, date, slots, note, label };
}

export async function loadAvailabilityContext(date: string, ex: DbLike = db): Promise<AvailabilityContext> {
  const settings = await readBookingSettings(ex);
  const windows = await ex.select().from(bookingWindows).where(eq(bookingWindows.active, true)).orderBy(asc(bookingWindows.startTime));
  const [override] = await ex.select().from(dateOverrides).where(eq(dateOverrides.date, date)).limit(1);
  const reservations = await getReservationsForDate(date, ex);
  return { settings, windows, override, reservations, clock: getClock(settings.timezone) };
}

export async function getAvailability(date: string, partySize: number): Promise<AvailabilityResult> {
  return computeAvailability(date, partySize, await loadAvailabilityContext(date));
}

/** Which upcoming dates are bookable at all (for the date picker). */
export async function getBookableDates(): Promise<{ from: string; to: string; closedDates: string[]; openDays: number[] }> {
  const settings = await readBookingSettings();
  const clock = getClock(settings.timezone);
  const to = addDays(clock.date, settings.maxDaysInAdvance);
  const [overrides, windows] = await Promise.all([
    db.select().from(dateOverrides).where(and(gte(dateOverrides.date, clock.date))),
    db.select().from(bookingWindows).where(eq(bookingWindows.active, true)),
  ]);
  const openDays = [...new Set(windows.map((w) => w.dayOfWeek))];
  const closedDates = overrides.filter((o) => o.closed).map((o) => o.date);
  const specialOpen = new Set(overrides.filter((o) => !o.closed).map((o) => o.date));
  const extraClosed: string[] = [];
  for (let d = clock.date; d <= to; d = addDays(d, 1)) {
    if (!openDays.includes(dayOfWeek(d)) && !specialOpen.has(d)) extraClosed.push(d);
  }
  return { from: clock.date, to, closedDates: [...new Set([...closedDates, ...extraClosed])], openDays };
}

/** Confirmation numbers look like RT-10042. */
export function generateConfirmationCode(id: number): string {
  return `RT-${10000 + id}`;
}
