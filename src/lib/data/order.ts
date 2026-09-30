import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

type OrderedTable = "menu_categories" | "menu_items" | "modifiers" | "modifier_groups" | "media";

/** Single-statement reorder: display_order = position of id in `ids`. */
export async function reorderRows(table: OrderedTable, ids: number[], extraSet = sql``) {
  const clean = [...new Set(ids.map((n) => Math.trunc(Number(n))).filter((n) => Number.isSafeInteger(n) && n > 0))];
  if (!clean.length) return;
  // Bind the ids as one Postgres array literal ("{1,2,3}") rather than a tuple.
  const literal = `{${clean.join(",")}}`;
  await db.execute(
    sql`update ${sql.raw(table)} as m set display_order = v.ord - 1${extraSet} from unnest(${literal}::int[]) with ordinality as v(id, ord) where m.id = v.id`,
  );
}

export async function nextOrder(table: OrderedTable, where = sql``): Promise<number> {
  const { rows } = await db.execute<{ m: number }>(sql`select coalesce(max(display_order), -1)::int as m from ${sql.raw(table)}${where}`);
  return (rows[0]?.m ?? -1) + 1;
}
