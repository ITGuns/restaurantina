import { describe, expect, it } from "vitest";
import type { Reservation } from "@/db/schema";
import { computeAvailability, generateConfirmationCode, type AvailabilityContext } from "@/lib/booking";
import { clock, settings, window } from "./fixtures";

const reservation = (time: string, partySize: number, status: Reservation["status"] = "confirmed"): Reservation => ({
  id: 1, confirmationCode: "RT-10001", manageToken: "t", idempotencyKey: null, firstName: "A", lastName: "B", email: "a@b.c", phone: "9155550100", partySize, date: "2026-10-03", time, occasion: null, specialRequests: null, status, source: "web", internalNotes: null, createdAt: "", updatedAt: "",
});

const ctx = (over: Partial<AvailabilityContext> = {}): AvailabilityContext => ({
  settings: settings(),
  windows: [window(6, "09:00", "18:00", "Desayuno y comida")],
  override: undefined,
  reservations: [],
  clock: clock(),
  ...over,
});

describe("computeAvailability", () => {
  it("generates slots every interval from first to last seating", () => {
    const res = computeAvailability("2026-10-03", 2, ctx());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.slots[0].time).toBe("09:00");
    expect(res.slots[res.slots.length - 1].time).toBe("18:00");
    expect(res.slots).toHaveLength(19);
    expect(res.slots[0].label).toBe("9:00 AM");
    expect(res.label).toBe("Desayuno y comida");
  });

  it("rejects past dates, dates too far out and closed days", () => {
    expect(computeAvailability("2026-09-29", 2, ctx())).toMatchObject({ ok: false, code: "past" });
    expect(computeAvailability("2027-01-01", 2, ctx())).toMatchObject({ ok: false, code: "too_far" });
    // Monday: no window configured
    expect(computeAvailability("2026-10-05", 2, ctx())).toMatchObject({ ok: false, code: "closed" });
  });

  it("rejects invalid party sizes and paused bookings", () => {
    expect(computeAvailability("2026-10-03", 0, ctx())).toMatchObject({ ok: false, code: "party_size" });
    expect(computeAvailability("2026-10-03", 9, ctx())).toMatchObject({ ok: false, code: "party_size" });
    expect(computeAvailability("2026-10-03", 2.5, ctx())).toMatchObject({ ok: false, code: "party_size" });
    expect(computeAvailability("2026-10-03", 2, ctx({ settings: settings({ bookingsEnabled: false }) }))).toMatchObject({ ok: false, code: "disabled" });
  });

  it("marks same-day slots that have passed or are inside the lead time", () => {
    const res = computeAvailability("2026-09-30", 2, ctx({ windows: [window(3, "09:00", "18:00")], clock: clock({ time: "10:10", minutes: 610 }) }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const by = Object.fromEntries(res.slots.map((s) => [s.time, s]));
    expect(by["09:30"].reason).toBe("past");
    expect(by["10:30"].reason).toBe("lead");
    expect(by["11:30"].available).toBe(true);
  });

  it("fills a slot when bookings or guests exceed capacity within the turn time", () => {
    const full = Array.from({ length: 6 }, () => reservation("12:00", 2));
    const res = computeAvailability("2026-10-03", 2, ctx({ reservations: full }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const by = Object.fromEntries(res.slots.map((s) => [s.time, s]));
    expect(by["12:00"].reason).toBe("full");
    expect(by["13:00"].reason).toBe("full"); // within 75-minute turn
    expect(by["13:30"].available).toBe(true);

    const covers = computeAvailability("2026-10-03", 4, ctx({ reservations: [reservation("12:00", 8), reservation("12:30", 8), reservation("12:30", 8), reservation("12:00", 3)] }));
    if (!covers.ok) throw new Error("expected ok");
    expect(Object.fromEntries(covers.slots.map((s) => [s.time, s.available]))["12:00"]).toBe(false);
  });

  it("ignores cancelled reservations", () => {
    const res = computeAvailability("2026-10-03", 2, ctx({ reservations: Array.from({ length: 6 }, () => reservation("12:00", 2, "cancelled")) }));
    if (!res.ok) throw new Error("expected ok");
    expect(res.slots.find((s) => s.time === "12:00")?.available).toBe(true);
  });

  it("honours date overrides: closed and special hours", () => {
    const closed = computeAvailability("2026-10-03", 2, ctx({ override: { id: 1, date: "2026-10-03", closed: true, startTime: null, endTime: null, isHoliday: true, reason: "Private event", createdAt: "", updatedAt: "" } }));
    expect(closed).toMatchObject({ ok: false, code: "closed" });
    expect(closed.ok ? "" : closed.message).toContain("Private event");
    const special = computeAvailability("2026-10-03", 2, ctx({ override: { id: 1, date: "2026-10-03", closed: false, startTime: "11:00", endTime: "13:00", isHoliday: false, reason: "Holiday hours", createdAt: "", updatedAt: "" } }));
    if (!special.ok) throw new Error("expected ok");
    expect(special.slots.map((s) => s.time)).toEqual(["11:00", "11:30", "12:00", "12:30", "13:00"]);
    expect(special.note).toContain("Holiday hours");
  });
});

describe("generateConfirmationCode", () => {
  it("looks like RT-1xxxx", () => {
    expect(generateConfirmationCode(1)).toBe("RT-10001");
    expect(generateConfirmationCode(42)).toMatch(/^RT-\d{5}$/);
  });
});
