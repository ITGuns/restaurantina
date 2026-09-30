"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import type { HoursCategory } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { revalidateContent, revalidateMenu } from "@/lib/revalidate";
import { SOURCE_HOURS } from "@/lib/source";
import { bookingWindowInput, dateOverrideInput, fieldErrors, hoursRowInput } from "@/lib/validation";
import { fromMinutes, toMinutes } from "@/lib/format";
import { fail, type ActionResult } from "./types";

const { hours, bookingWindows, dateOverrides, restaurantInfo } = schema;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/** Replace all rows for one hours category. Saving marks the hours as confirmed by the owner. */
export async function saveHoursCategory(category: HoursCategory, rows: unknown[]): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsedRows: import("zod").z.infer<typeof hoursRowInput>[] = [];
  const errors: Record<string, string> = {};
  for (const r of rows) {
    const p = hoursRowInput.safeParse({ ...(r as object), category });
    if (!p.success) {
      Object.assign(errors, Object.fromEntries(Object.entries(fieldErrors(p.error)).map(([k, v]) => [`${(r as { dayOfWeek?: number }).dayOfWeek}.${k}`, v])));
      continue;
    }
    if (!p.data.isClosed && !p.data.opensAt) errors[`${p.data.dayOfWeek}.opensAt`] = "Enter an opening time";
    if (!p.data.isClosed && !p.data.closesAt) errors[`${p.data.dayOfWeek}.closesAt`] = "Enter a closing time";
    if (!p.data.isClosed && p.data.opensAt && p.data.closesAt && toMinutes(p.data.closesAt) <= toMinutes(p.data.opensAt)) {
      errors[`${p.data.dayOfWeek}.closesAt`] = "Close must be after open";
    }
    parsedRows.push(p.data);
  }
  if (Object.keys(errors).length) return fail("Please fix the highlighted times.", { fieldErrors: errors });
  await db.transaction(async (tx) => {
    await tx.delete(hours).where(eq(hours.category, category));
    if (parsedRows.length) await tx.insert(hours).values(parsedRows.map((r) => ({ ...r, note: r.note ?? null, updatedAt: new Date().toISOString() })));
    await tx.update(restaurantInfo).set({ hoursConfirmed: true, updatedAt: new Date().toISOString() }).where(eq(restaurantInfo.id, 1));
  });
  revalidateContent();
  revalidateMenu();
  revalidatePath("/admin/hours");
  return { ok: true, data: undefined };
}

/** Apply one of the three hour sets from the source file (website / Google / social) in one click. */
export async function applySourceHours(key: string, syncWindows: boolean): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const src = SOURCE_HOURS.find((s) => s.key === key);
  if (!src) return fail("Unknown source.");
  await db.transaction(async (tx) => {
    await tx.delete(hours).where(eq(hours.category, "store"));
    await tx.insert(hours).values(src.rows.map((r) => ({ category: "store" as const, dayOfWeek: r.dayOfWeek, opensAt: r.opensAt, closesAt: r.closesAt, isClosed: r.isClosed })));
    await tx.update(restaurantInfo).set({ hoursConfirmed: true, updatedAt: new Date().toISOString() }).where(eq(restaurantInfo.id, 1));
  });
  if (syncWindows) await syncBookingWindowsToHours();
  revalidateContent();
  revalidateMenu();
  revalidatePath("/admin/hours");
  return { ok: true, data: undefined };
}

/** Rebuild the weekly reservation windows from the restaurant hours: first seating at opening, last seating 60 minutes before close. */
export async function syncBookingWindowsToHours(): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const rows = await db.select().from(hours).where(eq(hours.category, "store"));
  await db.transaction(async (tx) => {
    await tx.delete(bookingWindows);
    const values = rows
      .filter((r) => !r.isClosed && r.opensAt && r.closesAt && toMinutes(r.closesAt) - toMinutes(r.opensAt) > 60)
      .map((r) => ({ dayOfWeek: r.dayOfWeek, startTime: r.opensAt!, endTime: fromMinutes(toMinutes(r.closesAt!) - 60), label: null as string | null, active: true }));
    if (values.length) await tx.insert(bookingWindows).values(values);
  });
  revalidateContent();
  revalidatePath("/admin/hours");
  return { ok: true, data: undefined };
}

export async function saveBookingWindow(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const p = bookingWindowInput.safeParse(raw);
  if (!p.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(p.error) });
  if (toMinutes(p.data.endTime) < toMinutes(p.data.startTime)) return fail("Last seating must be after first seating.", { fieldErrors: { endTime: "Must be after start" } });
  const values = { dayOfWeek: p.data.dayOfWeek, startTime: p.data.startTime, endTime: p.data.endTime, label: p.data.label ?? null, active: p.data.active, updatedAt: new Date().toISOString() };
  let id = p.data.id;
  if (id) await db.update(bookingWindows).set(values).where(eq(bookingWindows.id, id));
  else [{ id }] = await db.insert(bookingWindows).values(values).returning({ id: bookingWindows.id });
  revalidateContent();
  revalidatePath("/admin/hours");
  return { ok: true, data: { id } };
}

export async function deleteBookingWindow(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(bookingWindows).where(eq(bookingWindows.id, id));
  revalidateContent();
  revalidatePath("/admin/hours");
  return { ok: true, data: undefined };
}

export async function saveDateOverride(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const p = dateOverrideInput.safeParse(raw);
  if (!p.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(p.error) });
  const d = p.data;
  if (!d.closed && Boolean(d.startTime) !== Boolean(d.endTime)) return fail("Special hours need both a first and last seating time.", { fieldErrors: { startTime: "Required" } });
  if (!d.closed && d.startTime && d.endTime && toMinutes(d.endTime) < toMinutes(d.startTime)) return fail("Last seating must be after first seating.", { fieldErrors: { endTime: "Must be after start" } });
  const values = {
    date: d.date,
    closed: d.closed,
    startTime: d.closed ? null : (d.startTime ?? null),
    endTime: d.closed ? null : (d.endTime ?? null),
    isHoliday: d.isHoliday,
    reason: d.reason ?? null,
    updatedAt: new Date().toISOString(),
  };
  const [existing] = await db.select({ id: dateOverrides.id }).from(dateOverrides).where(eq(dateOverrides.date, d.date)).limit(1);
  let id = d.id ?? existing?.id;
  if (id) await db.update(dateOverrides).set(values).where(eq(dateOverrides.id, id));
  else [{ id }] = await db.insert(dateOverrides).values(values).returning({ id: dateOverrides.id });
  revalidateContent();
  revalidatePath("/admin/hours");
  return { ok: true, data: { id } };
}

export async function deleteDateOverride(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(dateOverrides).where(eq(dateOverrides.id, id));
  revalidateContent();
  revalidatePath("/admin/hours");
  return { ok: true, data: undefined };
}
