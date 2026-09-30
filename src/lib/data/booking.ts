import "server-only";
import { asc, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import type { BookingWindow, DateOverride } from "@/db/schema";

export async function readBookingWindows(): Promise<BookingWindow[]> {
  return db.select().from(schema.bookingWindows).orderBy(asc(schema.bookingWindows.dayOfWeek), asc(schema.bookingWindows.startTime));
}

export async function readDateOverrides(from?: string): Promise<DateOverride[]> {
  const q = db.select().from(schema.dateOverrides).orderBy(asc(schema.dateOverrides.date));
  return from ? q.where(gte(schema.dateOverrides.date, from)) : q;
}
