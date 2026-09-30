import type { Hours, HoursCategory, MenuAvailability, MenuItem } from "@/db/schema";
import { DAY_NAMES } from "./constants";
import { daysLabelWeek, time12, toMinutes } from "./format";

export type Clock = {
  /** YYYY-MM-DD in restaurant timezone */
  date: string;
  /** HH:MM */
  time: string;
  minutes: number;
  dayOfWeek: number;
};

export function getClock(timezone: string, now: Date = new Date()): Clock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  const time = `${hour}:${get("minute")}`;
  const weekdayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time,
    minutes: toMinutes(time),
    dayOfWeek: weekdayIdx,
  };
}

export function hoursFor(rows: Hours[], category: HoursCategory, dayOfWeek: number): Hours | undefined {
  return rows.find((h) => h.category === category && h.dayOfWeek === dayOfWeek);
}

export function resolveWindow(row: Hours | undefined): { open: number; close: number } | null {
  if (!row || row.isClosed || !row.opensAt || !row.closesAt) return null;
  return { open: toMinutes(row.opensAt), close: toMinutes(row.closesAt) };
}

export function isOpenNow(rows: Hours[], category: HoursCategory, clock: Clock): boolean {
  const win = resolveWindow(hoursFor(rows, category, clock.dayOfWeek));
  if (!win) return false;
  return clock.minutes >= win.open && clock.minutes < win.close;
}

export type StoreStatus = {
  isOpen: boolean;
  label: string;
  detail: string;
  today: Hours | undefined;
};

export function storeStatus(rows: Hours[], clock: Clock): StoreStatus {
  const today = hoursFor(rows, "store", clock.dayOfWeek);
  const win = resolveWindow(today);
  if (win && clock.minutes >= win.open && clock.minutes < win.close) {
    const closingSoon = win.close - clock.minutes <= 60;
    return {
      isOpen: true,
      label: closingSoon ? "Closing soon" : "Open now",
      detail: `Closes ${time12(today!.closesAt, { compact: true })}`,
      today,
    };
  }
  if (win && clock.minutes < win.open) {
    return { isOpen: false, label: "Closed", detail: `Opens today at ${time12(today!.opensAt, { compact: true })}`, today };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (clock.dayOfWeek + i) % 7;
    const row = hoursFor(rows, "store", d);
    const w = resolveWindow(row);
    if (w) {
      const dayLabel = i === 1 ? "tomorrow" : DAY_NAMES[d];
      return { isOpen: false, label: "Closed", detail: `Opens ${dayLabel} at ${time12(row!.opensAt, { compact: true })}`, today };
    }
  }
  return { isOpen: false, label: "Closed", detail: "", today };
}

export type AvailabilityInfo = {
  /** true when the restaurant is open and the item's own windows (if any) pass right now */
  availableNow: boolean;
  /** true when the item is served at some point today */
  availableToday: boolean;
  /** short badge text, e.g. "Sat & Sun", "Until 11 AM" */
  label: string | null;
  /** longer explanation for the detail drawer */
  detail: string | null;
};

function withinTimes(start: string | null | undefined, end: string | null | undefined, minutes: number): boolean {
  if (start && minutes < toMinutes(start)) return false;
  if (end && minutes >= toMinutes(end)) return false;
  return true;
}

/** Describe one availability window, e.g. "Sat & Sun · 9 AM–1 PM". */
export function describeWindow(w: Pick<MenuAvailability, "days" | "startTime" | "endTime">): string {
  const days = w.days.length ? daysLabelWeek(w.days) : "Daily";
  const s = w.startTime ? time12(w.startTime, { compact: true }) : null;
  const e = w.endTime ? time12(w.endTime, { compact: true }) : null;
  const times = s && e ? `${s}–${e}` : e ? `until ${e}` : s ? `from ${s}` : "";
  return times ? `${days} · ${times}` : days;
}

export function itemAvailability(
  item: Pick<MenuItem, "active" | "availabilityNote">,
  windows: Pick<MenuAvailability, "days" | "startTime" | "endTime" | "active">[],
  rows: Hours[],
  clock: Clock,
): AvailabilityInfo {
  if (!item.active) {
    return { availableNow: false, availableToday: false, label: "Currently unavailable", detail: "Temporarily off the menu." };
  }
  const storeNow = isOpenNow(rows, "store", clock);
  const storeToday = resolveWindow(hoursFor(rows, "store", clock.dayOfWeek)) !== null;
  const active = windows.filter((w) => w.active);
  if (!active.length) {
    return { availableNow: storeNow, availableToday: storeToday, label: item.availabilityNote ?? null, detail: null };
  }
  const todays = active.filter((w) => !w.days.length || w.days.includes(clock.dayOfWeek));
  const nowOk = todays.some((w) => withinTimes(w.startTime, w.endTime, clock.minutes));
  const label = item.availabilityNote ?? (active.length === 1 ? describeWindow(active[0]) : "Limited hours");
  const detail = `Served ${active.map(describeWindow).join("; ")}.`;
  return { availableNow: storeNow && nowOk, availableToday: storeToday && todays.length > 0, label, detail };
}

/** Human summary for a hours category across the week, grouping identical consecutive days. */
export function summarizeHours(rows: Hours[], category: HoursCategory = "store"): { days: string; hours: string; note?: string }[] {
  const week = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const groups: { days: number[]; key: string; hours: string; note?: string }[] = [];
  for (const d of week) {
    const row = hoursFor(rows, category, d);
    let key: string;
    let hoursText: string;
    if (!row || row.isClosed || !row.opensAt || !row.closesAt) {
      key = "closed";
      hoursText = "Closed";
    } else {
      hoursText = `${time12(row.opensAt, { compact: true })} – ${time12(row.closesAt, { compact: true })}`;
      key = hoursText;
    }
    const last = groups[groups.length - 1];
    if (last && last.key === key && last.days[last.days.length - 1] === (d === 0 ? 6 : d - 1)) {
      last.days.push(d);
    } else {
      groups.push({ days: [d], key, hours: hoursText, note: row?.note ?? undefined });
    }
  }
  return groups.map((g) => ({ days: daysLabelOrdered(g.days), hours: g.hours, note: g.note }));
}

function daysLabelOrdered(days: number[]): string {
  const short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (days.length === 1) return short[days[0]];
  if (days.length === 7) return "Every day";
  return `${short[days[0]]} – ${short[days[days.length - 1]]}`;
}
