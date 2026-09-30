import "server-only";
import { eq, sql } from "drizzle-orm";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";

export const SESSION_COOKIE = "rt_admin";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export type AdminSession = { sub: number; email: string; name: string; role: string; ver: number };

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ chars) in .env.local");
  return new TextEncoder().encode(s);
}

export async function createSession(user: AdminSession): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role, ver: user.ver })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.sub))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SEC}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

/** Clears the cookie AND invalidates every token issued to this user (server-side revocation). */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (session) await revokeSessions(session.sub);
  jar.delete(SESSION_COOKIE);
}

/** Bump the user's token version; returns the new version. */
export async function revokeSessions(userId: number): Promise<number> {
  const [row] = await db
    .update(schema.adminUsers)
    .set({ tokenVersion: sql`${schema.adminUsers.tokenVersion} + 1` })
    .where(eq(schema.adminUsers.id, userId))
    .returning({ tokenVersion: schema.adminUsers.tokenVersion });
  return row?.tokenVersion ?? 0;
}

/** Signature + expiry check only (no database). The middleware uses the same rule. */
export async function verifySessionToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      sub: Number(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "admin"),
      ver: Number(payload.ver ?? 0),
    };
  } catch {
    return null;
  }
}

/** Full check: valid signature AND the token was issued after the last sign-out / password change. */
export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [user] = await db.select({ tokenVersion: schema.adminUsers.tokenVersion }).from(schema.adminUsers).where(eq(schema.adminUsers.id, session.sub)).limit(1);
  if (!user || user.tokenVersion !== session.ver) return null;
  return session;
}

/** Use in server actions + route handlers: throws if not authenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/** Use in admin pages/layouts: redirects to login. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) {
    const h = await headers();
    const next = h.get("x-pathname") ?? "/admin";
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  return session;
}

export async function clientKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "local";
}
