import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * node-postgres never pipelines queries on a connection, which keeps results
 * correctly attributed through Supabase's transaction-mode pooler even under
 * the concurrent, cold-start heavy access pattern of serverless functions.
 */
export function needsSsl(url: string): boolean {
  if (/sslmode=disable/.test(url)) return false;
  if (/sslmode=(require|verify)/.test(url)) return true;
  return !/@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);
}

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Run `npm run db:local init` or add your Postgres connection string to .env.local.");
  return new Pool({
    connectionString: url,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 4 : 8,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __restaurantinaPool: Pool | undefined;
}

// Reuse one pool across Next.js hot reloads / route modules.
const pool = globalThis.__restaurantinaPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__restaurantinaPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
export type Db = typeof db;
/** Either the root db or a transaction handle. */
export type DbLike = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
