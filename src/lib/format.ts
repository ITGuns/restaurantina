import { DAY_SHORT } from "./constants";

/** cents → "$14.70" (keeps cents when present, drops ".00") */
export function money(cents: number | null | undefined, opts: { always?: boolean } = {}): string {
  if (cents == null) return "";
  const dollars = cents / 100;
  const hasCents = cents % 100 !== 0;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: hasCents || opts.always ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** "+$2" / "included" for modifier price adjustments */
export function priceAdjustment(cents: number): string {
  if (!cents) return "included";
  return `${cents < 0 ? "−" : "+"}${money(Math.abs(cents))}`;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "17:30" → "5:30 PM", "12:00" → "12 PM" (compact) */
export function time12(hhmm: string | null | undefined, opts: { compact?: boolean } = {}): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  if (opts.compact && m === 0) return `${hour} ${suffix}`;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "2026-09-26" → Date at local noon (safe for weekday/formatting) */
export function parseDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function dayOfWeek(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(ymd: string, n: number): string {
  const d = parseDate(ymd);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

export function longDate(ymd: string, opts: { weekday?: boolean; year?: boolean } = { weekday: true }): string {
  return parseDate(ymd).toLocaleDateString("en-US", {
    weekday: opts.weekday ? "long" : undefined,
    month: "long",
    day: "numeric",
    year: opts.year ? "numeric" : undefined,
  });
}

export function shortDate(ymd: string): string {
  return parseDate(ymd).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** [5,6] → "Fri–Sat", [3,4,5] → "Wed–Fri", [0] → "Sun", [2,4] → "Tue, Thu" */
export function daysLabel(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return "";
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return "Daily";
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous && sorted.length > 2) return `${DAY_SHORT[sorted[0]]}–${DAY_SHORT[sorted[sorted.length - 1]]}`;
  if (contiguous && sorted.length === 2) return `${DAY_SHORT[sorted[0]]} & ${DAY_SHORT[sorted[1]]}`;
  return sorted.map((d) => DAY_SHORT[d]).join(", ");
}

/** Like daysLabel, but ordered Mon→Sun so weekends read "Sat & Sun". */
export function daysLabelWeek(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return "";
  const order = [1, 2, 3, 4, 5, 6, 0];
  const sorted = [...new Set(days)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  if (sorted.length === 7) return "Daily";
  const contiguous = sorted.every((d, i) => i === 0 || order.indexOf(d) === order.indexOf(sorted[i - 1]) + 1);
  if (contiguous && sorted.length > 2) return `${DAY_SHORT[sorted[0]]}–${DAY_SHORT[sorted[sorted.length - 1]]}`;
  if (contiguous && sorted.length === 2) return `${DAY_SHORT[sorted[0]]} & ${DAY_SHORT[sorted[1]]}`;
  return sorted.map((d) => DAY_SHORT[d]).join(", ");
}

/** Joins names with ", " until adding the next one would exceed `max` characters (used for meta descriptions). */
export function joinWithin(names: string[], max: number): string {
  let out = "";
  for (const n of names) {
    const next = out ? `${out}, ${n}` : n;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

/** Accepts ISO strings and Postgres timestamptz text ("2026-09-22 16:58:33.414+00"). */
export function parsePgTimestamp(value: string): Date {
  let s = value.includes("T") ? value : value.replace(" ", "T");
  if (/[+-]\d{2}$/.test(s)) s += ":00";
  else if (!/[zZ]$|[+-]\d{2}:\d{2}$/.test(s)) s += "Z";
  return new Date(s);
}

export function phoneHref(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}

export function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function formatRelative(iso: string): string {
  const then = parsePgTimestamp(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
