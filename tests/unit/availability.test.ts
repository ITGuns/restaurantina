import { describe, expect, it } from "vitest";
import { describeWindow, itemAvailability, storeStatus, summarizeHours } from "@/lib/availability";
import { availabilityWindow, clock, hoursRow, storeHours } from "./fixtures";

describe("storeStatus", () => {
  it("reports open / closing soon / closed with the next opening", () => {
    expect(storeStatus(storeHours, clock({ time: "12:00", minutes: 720 }))).toMatchObject({ isOpen: true, label: "Open now", detail: "Closes 7 PM" });
    expect(storeStatus(storeHours, clock({ time: "18:30", minutes: 1110 }))).toMatchObject({ isOpen: true, label: "Closing soon" });
    expect(storeStatus(storeHours, clock({ time: "08:00", minutes: 480 }))).toMatchObject({ isOpen: false, detail: "Opens today at 9 AM" });
    expect(storeStatus(storeHours, clock({ time: "20:00", minutes: 1200 }))).toMatchObject({ isOpen: false, detail: "Opens tomorrow at 9 AM" });
  });
  it("skips closed days when finding the next opening", () => {
    const google = [hoursRow(1, null, null, true), ...[2, 3, 4, 5, 6].map((d) => hoursRow(d, "09:00", "17:00")), hoursRow(0, "09:00", "15:00")];
    expect(storeStatus(google, clock({ date: "2026-10-04", dayOfWeek: 0, time: "16:00", minutes: 960 })).detail).toBe("Opens Tuesday at 9 AM");
  });
});

describe("summarizeHours", () => {
  it("groups identical consecutive days", () => {
    expect(summarizeHours(storeHours)).toEqual([
      { days: "Mon – Sat", hours: "9 AM – 7 PM", note: undefined },
      { days: "Sun", hours: "9 AM – 5 PM", note: undefined },
    ]);
  });
  it("shows closed days", () => {
    const rows = [hoursRow(1, null, null, true), ...[2, 3, 4, 5, 6].map((d) => hoursRow(d, "09:00", "17:00")), hoursRow(0, "09:00", "15:00")];
    expect(summarizeHours(rows).map((r) => `${r.days}: ${r.hours}`)).toEqual(["Mon: Closed", "Tue – Sat: 9 AM – 5 PM", "Sun: 9 AM – 3 PM"]);
  });
});

describe("itemAvailability", () => {
  const item = { active: true, availabilityNote: null };
  it("follows restaurant hours when the item has no windows", () => {
    expect(itemAvailability(item, [], storeHours, clock({ time: "12:00", minutes: 720 }))).toMatchObject({ availableNow: true, availableToday: true, label: null });
    expect(itemAvailability(item, [], storeHours, clock({ time: "20:00", minutes: 1200 })).availableNow).toBe(false);
  });
  it("applies day/time windows", () => {
    const weekendMornings = [availabilityWindow({ days: [6, 0], startTime: null, endTime: "13:00" })];
    expect(itemAvailability(item, weekendMornings, storeHours, clock({ dayOfWeek: 3, time: "10:00", minutes: 600 }))).toMatchObject({ availableToday: false, availableNow: false, label: "Sat & Sun · until 1 PM" });
    expect(itemAvailability(item, weekendMornings, storeHours, clock({ date: "2026-10-03", dayOfWeek: 6, time: "10:00", minutes: 600 }))).toMatchObject({ availableToday: true, availableNow: true });
    expect(itemAvailability(item, weekendMornings, storeHours, clock({ date: "2026-10-03", dayOfWeek: 6, time: "14:00", minutes: 840 })).availableNow).toBe(false);
  });
  it("prefers the owner's label and marks inactive items unavailable", () => {
    expect(itemAvailability({ active: true, availabilityNote: "Weekends only" }, [availabilityWindow({ days: [6, 0] })], storeHours, clock()).label).toBe("Weekends only");
    expect(itemAvailability({ active: false, availabilityNote: null }, [], storeHours, clock())).toMatchObject({ availableNow: false, label: "Currently unavailable" });
  });
  it("describes windows", () => {
    expect(describeWindow({ days: [], startTime: "09:00", endTime: "11:00" })).toBe("Daily · 9 AM–11 AM");
    expect(describeWindow({ days: [1, 2, 3, 4, 5], startTime: null, endTime: null })).toBe("Mon–Fri");
  });
});
