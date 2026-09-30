/** Client-safe helpers for "Add to calendar" links. */

const DEFAULT_TZ = "America/Denver";

function stamp(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export type CalendarEvent = {
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  uid: string;
  url?: string;
  timezone?: string;
};

export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.date, e.time)}/${stamp(e.date, addMinutes(e.time, e.durationMinutes))}`,
    ctz: e.timezone ?? DEFAULT_TZ,
    details: e.description + (e.url ? `\n${e.url}` : ""),
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(e: CalendarEvent): string {
  const tz = e.timezone ?? DEFAULT_TZ;
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RestauranTina//Reservations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=${tz}:${stamp(e.date, e.time)}`,
    `DTEND;TZID=${tz}:${stamp(e.date, addMinutes(e.time, e.durationMinutes))}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(e.description + (e.url ? `\n${e.url}` : ""))}`,
    `LOCATION:${esc(e.location)}`,
    e.url ? `URL:${e.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(e: CalendarEvent, filename = "reservation.ics") {
  const blob = new Blob([buildIcs(e)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
