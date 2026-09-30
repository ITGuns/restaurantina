import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { closePool, query } from "../helpers/db";

/** The database must still match restaurantina-data.md item by item. */
test.describe("data integrity vs source", () => {
  test.afterAll(closePool);
  test("every source menu row exists in the database with the same price and category", async () => {
    const md = readFileSync("restaurantina-data.md", "utf8");
    const section = md.split("## 7. Full Menu")[1].split("## 8.")[0];
    let category = "";
    const rows: { category: string; name: string; price: number }[] = [];
    for (const line of section.split("\n")) {
      const h = line.match(/^### (.+)$/);
      if (h) { category = h[1].replace(/\s*\(.*\)$/, "").replace(/^Plates \/ /, "").trim(); continue; }
      const row = line.match(/^\| (.+?) \| (?:(.+?) \| )?\$(\d+\.\d{2}) \|$/);
      if (!row || row[1] === "Item" || row[1].startsWith("---")) continue;
      rows.push({ category, name: row[1].trim(), price: Math.round(Number(row[3]) * 100) });
    }
    expect(rows).toHaveLength(82);
    const db = await query<{ name: string; price: number; category: string }>(`select i.name, i.price, c.name as category from menu_items i join menu_categories c on c.id = i.category_id where i.name not like 'QA %'`);
    for (const r of rows) {
      const found = db.find((d) => d.name === r.name && d.category === r.category);
      expect(found, `${r.category} › ${r.name}`).toBeTruthy();
      expect(found!.price).toBe(r.price);
    }
    const [info] = await query<{ name: string; tagline: string; address_line1: string; phone_primary: string; phone_secondary: string; instagram_url: string; tiktok_url: string; facebook_url: string }>(`select * from restaurant_info where id = 1`);
    expect(info).toMatchObject({ name: "RestauranTina", tagline: "Authentic Mexican Cuisine", address_line1: "12115 Montwood Dr Ste 201B", phone_primary: "(915) 259-8774", phone_secondary: "(915) 268-1543", instagram_url: "https://www.instagram.com/restaurantina_/", tiktok_url: "https://www.tiktok.com/@restaurantina" });
    expect(info.facebook_url).toContain("Restauran-Tina-61589615797924");
  });
});
