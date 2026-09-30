"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import type { Reservation, ReservationStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { generateConfirmationCode } from "@/lib/booking";
import { adminReservationInput, fieldErrors, statusInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { reservations } = schema;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

export async function updateReservationStatus(id: number, status: ReservationStatus): Promise<ActionResult<Reservation>> {
  const g = await guard();
  if (g) return g;
  const parsed = statusInput.safeParse(status);
  if (!parsed.success) return fail("Invalid status.");
  const [row] = await db.update(reservations).set({ status: parsed.data, updatedAt: new Date().toISOString() }).where(eq(reservations.id, id)).returning();
  if (!row) return fail("Reservation not found.");
  revalidatePath("/admin", "layout");
  return { ok: true, data: row };
}

export async function saveReservation(raw: unknown): Promise<ActionResult<Reservation>> {
  const g = await guard();
  if (g) return g;
  const parsed = adminReservationInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const d = parsed.data;
  const values = {
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email.toLowerCase(),
    phone: d.phone,
    partySize: d.partySize,
    date: d.date,
    time: d.time,
    occasion: d.occasion ?? null,
    specialRequests: d.specialRequests ?? null,
    internalNotes: d.internalNotes ?? null,
    status: d.status,
    updatedAt: new Date().toISOString(),
  };
  let row: Reservation | undefined;
  if (d.id) {
    [row] = await db.update(reservations).set(values).where(eq(reservations.id, d.id)).returning();
    if (!row) return fail("Reservation not found.");
  } else {
    row = await db.transaction(async (tx) => {
      const token = randomBytes(16).toString("hex");
      const [inserted] = await tx.insert(reservations).values({ ...values, confirmationCode: `TMP-${token}`, manageToken: token, source: "admin" }).returning();
      const code = generateConfirmationCode(inserted.id);
      const [updated] = await tx.update(reservations).set({ confirmationCode: code }).where(eq(reservations.id, inserted.id)).returning();
      return updated;
    });
  }
  revalidatePath("/admin", "layout");
  return { ok: true, data: row! };
}

export async function deleteReservation(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(reservations).where(eq(reservations.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true, data: undefined };
}
