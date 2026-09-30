/** Restaurant-timezone date helpers for picking bookable days. El Paso is on Mountain Time. */
export function todayInZone(tz = "America/Denver"): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function weekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Next date (at least `minDaysAhead` out) that falls on `dow`. */
export function nextWeekday(dow: number, minDaysAhead = 2): string {
  let d = addDays(todayInZone(), minDaysAhead);
  while (weekday(d) !== dow) d = addDays(d, 1);
  return d;
}

export function longDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** Matches the date picker button for a day whether or not it is marked unavailable. */
export function dayButtonName(ymd: string): RegExp {
  return new RegExp(`^${longDate(ymd)}( \\(unavailable\\))?$`);
}
