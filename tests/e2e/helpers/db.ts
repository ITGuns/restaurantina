import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

let pool: Pool | undefined;
function db(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL missing for e2e helpers");
    const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url) && !/sslmode=require/.test(url);
    pool = new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false }, max: 2 });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await db().query(text, params);
  return res.rows as T[];
}

/** Every record the suite creates is tagged so cleanup is exact. */
export const QA = { emailDomain: "qa.restaurantina.test", prefix: "QA " };

export async function cleanupAll() {
  await query(`delete from reservations where email like $1`, [`%@${QA.emailDomain}`]);
  await query(`delete from menu_items where name like $1`, [`${QA.prefix}%`]);
  await query(`delete from menu_categories where name like $1`, [`${QA.prefix}%`]);
  await query(`delete from modifier_groups where name like $1`, [`${QA.prefix}%`]);
  await query(`delete from date_overrides where reason like $1`, [`${QA.prefix}%`]);
  await query(`delete from booking_windows where label like $1`, [`${QA.prefix}%`]);
  await query(`delete from media where alt like $1`, [`${QA.prefix}%`]);
  await query(`delete from uploads where name not in (select substring(file from 10) from media where file like '/uploads/%')`);
}

export async function insertReservations(rows: { date: string; time: string; partySize: number; status?: string }[]) {
  for (const [i, r] of rows.entries()) {
    await query(
      `insert into reservations (confirmation_code, manage_token, first_name, last_name, email, phone, party_size, date, time, status, source)
       values ($1, $2, 'QA', 'Seat', $3, '(915) 555-0100', $4, $5, $6, $7, 'test')`,
      [`QA-${Date.now()}-${i}`, `qa-token-${Date.now()}-${i}`, `qa-cap-${i}@${QA.emailDomain}`, r.partySize, r.date, r.time, r.status ?? "confirmed"],
    );
  }
}

export async function reservationByCode(code: string) {
  const [row] = await query<{ status: string; party_size: number; email: string; source: string }>(`select status, party_size, email, source from reservations where confirmation_code = $1`, [code]);
  return row;
}

export async function closePool() {
  await pool?.end();
  pool = undefined;
}
