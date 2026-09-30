"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateContent } from "@/lib/revalidate";
import { bookingSettingsInput, fieldErrors, restaurantInfoInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { bookingSettings, restaurantInfo } = schema;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

export async function saveBookingSettings(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const p = bookingSettingsInput.safeParse(raw);
  if (!p.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(p.error) });
  if (p.data.maxPartySize < p.data.minPartySize) return fail("Max party size must be ≥ min.", { fieldErrors: { maxPartySize: "Must be ≥ min" } });
  await db.update(bookingSettings).set({ ...p.data, updatedAt: new Date().toISOString() }).where(eq(bookingSettings.id, 1));
  revalidateContent();
  revalidatePath("/admin/settings");
  return { ok: true, data: undefined };
}

/** Saves whichever settings fields the form sent (each settings card submits its own subset). */
export async function saveRestaurantInfo(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const p = restaurantInfoInput.safeParse(raw);
  if (!p.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(p.error) });
  const values = Object.fromEntries(Object.entries(p.data).filter(([, v]) => v !== undefined));
  if (values.featuredPhone === "secondary" && "phoneSecondary" in values && !values.phoneSecondary) {
    return fail("Add the secondary number before featuring it.", { fieldErrors: { phoneSecondary: "Required to feature this number" } });
  }
  if (!Object.keys(values).length) return fail("Nothing to save.");
  await db.update(restaurantInfo).set({ ...values, updatedAt: new Date().toISOString() }).where(eq(restaurantInfo.id, 1));
  revalidateContent();
  revalidatePath("/admin", "layout");
  return { ok: true, data: undefined };
}
