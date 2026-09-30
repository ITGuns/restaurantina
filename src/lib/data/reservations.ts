import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db, schema, type DbLike } from "@/db";
import type { Reservation, ReservationStatus } from "@/db/schema";

const { reservations } = schema;

export const ACTIVE_STATUSES: ReservationStatus[] = ["pending", "confirmed"];

export type ReservationFilters = {
  date?: string;
  from?: string;
  to?: string;
  status?: ReservationStatus | "active" | "all";
  q?: string;
  limit?: number;
};

export async function listReservations(f: ReservationFilters = {}): Promise<Reservation[]> {
  const conds = [];
  if (f.date) conds.push(eq(reservations.date, f.date));
  if (f.from) conds.push(gte(reservations.date, f.from));
  if (f.to) conds.push(lte(reservations.date, f.to));
  if (f.status && f.status !== "all") {
    conds.push(f.status === "active" ? inArray(reservations.status, ACTIVE_STATUSES) : eq(reservations.status, f.status));
  }
  if (f.q) {
    const term = `%${f.q.trim()}%`;
    conds.push(
      or(
        ilike(reservations.firstName, term),
        ilike(reservations.lastName, term),
        ilike(reservations.email, term),
        ilike(reservations.phone, term),
        ilike(reservations.confirmationCode, term),
      ),
    );
  }
  return db
    .select()
    .from(reservations)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(reservations.date), asc(reservations.time), desc(reservations.id))
    .limit(f.limit ?? 500);
}

export async function getReservationById(id: number): Promise<Reservation | undefined> {
  const [r] = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return r;
}

export async function getReservationByCode(code: string): Promise<Reservation | undefined> {
  const [r] = await db.select().from(reservations).where(eq(reservations.confirmationCode, code.toUpperCase())).limit(1);
  return r;
}

export async function getReservationsForDate(date: string, ex: DbLike = db): Promise<Reservation[]> {
  return ex
    .select()
    .from(reservations)
    .where(and(eq(reservations.date, date), inArray(reservations.status, ACTIVE_STATUSES)));
}

export type DashboardStats = {
  today: { total: number; confirmed: number; pending: number; cancelled: number; completed: number; noShow: number; covers: number };
  upcomingCount: number;
  upcoming: Reservation[];
  todayList: Reservation[];
  pendingCount: number;
};

export async function dashboardStats(today: string): Promise<DashboardStats> {
  const [todayList, [upcomingRows], [pendingRows], upcoming] = await Promise.all([
    listReservations({ date: today, status: "all" }),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reservations)
      .where(and(gte(reservations.date, today), inArray(reservations.status, ACTIVE_STATUSES))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reservations)
      .where(and(gte(reservations.date, today), eq(reservations.status, "pending"))),
    listReservations({ from: today, status: "active", limit: 8 }),
  ]);
  const count = (s: ReservationStatus) => todayList.filter((r) => r.status === s).length;
  return {
    today: {
      total: todayList.length,
      confirmed: count("confirmed"),
      pending: count("pending"),
      cancelled: count("cancelled"),
      completed: count("completed"),
      noShow: count("no_show"),
      covers: todayList.filter((r) => ACTIVE_STATUSES.includes(r.status)).reduce((n, r) => n + r.partySize, 0),
    },
    upcomingCount: upcomingRows?.n ?? 0,
    pendingCount: pendingRows?.n ?? 0,
    upcoming,
    todayList,
  };
}

/** Counts per date for a month (calendar view). */
export async function reservationCountsByDate(from: string, to: string): Promise<Record<string, { total: number; covers: number }>> {
  const rows = await db
    .select({ date: reservations.date, n: sql<number>`count(*)::int`, covers: sql<number>`coalesce(sum(${reservations.partySize}), 0)::int` })
    .from(reservations)
    .where(and(gte(reservations.date, from), lte(reservations.date, to), inArray(reservations.status, ACTIVE_STATUSES)))
    .groupBy(reservations.date);
  return Object.fromEntries(rows.map((r) => [r.date, { total: r.n, covers: r.covers ?? 0 }]));
}
