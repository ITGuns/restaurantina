"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { clientKey, createSession, destroySession, requireAdmin, revokeSessions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { loginInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { adminUsers } = schema;

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const key = await clientKey();
  const rl = rateLimit(`login:${key}`, 10, 15 * 60_000);
  if (!rl.ok) return fail("Too many login attempts. Try again in a few minutes.");

  const parsed = loginInput.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return fail("Enter your email and password.");

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email.toLowerCase())).limit(1);
  // Always run one hash comparison so timing doesn't reveal whether the email exists.
  const ok = user ? verifyPassword(parsed.data.password, user.passwordHash) : (verifyPassword(parsed.data.password, "00:00"), false);
  if (!user || !ok) return fail("Incorrect email or password.");

  await db.update(adminUsers).set({ lastLoginAt: new Date().toISOString() }).where(eq(adminUsers.id, user.id));
  await createSession({ sub: user.id, email: user.email, name: user.name, role: user.role, ver: user.tokenVersion });
  const next = String(formData.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (next.length < 10) return fail("New password must be at least 10 characters.");
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.sub)).limit(1);
  if (!user || !verifyPassword(current, user.passwordHash)) return fail("Current password is incorrect.");
  await db.update(adminUsers).set({ passwordHash: hashPassword(next), updatedAt: new Date().toISOString() }).where(eq(adminUsers.id, user.id));
  // Sign every other device out, but keep this session alive with a fresh token.
  const ver = await revokeSessions(user.id);
  await createSession({ sub: user.id, email: user.email, name: user.name, role: user.role, ver });
  return { ok: true, data: undefined };
}
