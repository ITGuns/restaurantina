import type { BookingSettings, BookingWindow, Hours, MenuAvailability } from "@/db/schema";
import type { Clock } from "@/lib/availability";

export const settings = (over: Partial<BookingSettings> = {}): BookingSettings => ({
  id: 1,
  slotIntervalMinutes: 30,
  turnTimeMinutes: 75,
  minPartySize: 1,
  maxPartySize: 8,
  largePartyThreshold: 7,
  maxBookingsPerSlot: 6,
  maxCoversPerSlot: 30,
  minLeadTimeMinutes: 60,
  maxDaysInAdvance: 60,
  autoConfirm: true,
  bookingsEnabled: true,
  occasions: [],
  timezone: "America/Denver",
  createdAt: "",
  updatedAt: "",
  ...over,
});

export const window = (dayOfWeek: number, startTime: string, endTime: string, label: string | null = null): BookingWindow => ({
  id: dayOfWeek * 10,
  dayOfWeek,
  startTime,
  endTime,
  label,
  active: true,
  createdAt: "",
  updatedAt: "",
});

/** Wednesday 2026-09-30 10:00 in the restaurant's zone. */
export const clock = (over: Partial<Clock> = {}): Clock => ({ date: "2026-09-30", time: "10:00", minutes: 600, dayOfWeek: 3, ...over });

export const hoursRow = (dayOfWeek: number, opensAt: string | null, closesAt: string | null, isClosed = false): Hours => ({
  id: 0,
  category: "store",
  dayOfWeek,
  opensAt,
  closesAt,
  isClosed,
  note: null,
  createdAt: "",
  updatedAt: "",
});

/** Store hours matching the seed (website set): Mon–Sat 9–7, Sun 9–5. */
export const storeHours: Hours[] = [hoursRow(0, "09:00", "17:00"), ...[1, 2, 3, 4, 5, 6].map((d) => hoursRow(d, "09:00", "19:00"))];

export const availabilityWindow = (over: Partial<MenuAvailability> = {}): MenuAvailability => ({ id: 1, itemId: 1, days: [], startTime: null, endTime: null, active: true, createdAt: "", updatedAt: "", ...over });
