import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MENU, MENU_ITEM_COUNT } from "@/db/seed-data/menu";
import { BOOKING_WINDOWS, HOURS, MEDIA, RESTAURANT } from "@/db/seed-data/restaurant";
import { SOURCE_HOURS } from "@/lib/source";

/**
 * Compares the seed data against restaurantina-data.md, the primary source of
 * truth: every menu table row must exist with the same name, description and
 * price; contact facts must match; nothing may be invented.
 */
const md = readFileSync("restaurantina-data.md", "utf8");

type SourceItem = { category: string; name: string; description: string | null; price: number };
function parseSourceMenu(): SourceItem[] {
  const out: SourceItem[] = [];
  const section = md.split("## 7. Full Menu")[1].split("## 8.")[0];
  let category = "";
  for (const line of section.split("\n")) {
    const h = line.match(/^### (.+)$/);
    if (h) {
      category = h[1].replace(/\s*\(.*\)$/, "").replace(/^Plates \/ /, "").trim();
      continue;
    }
    const row = line.match(/^\| (.+?) \| (?:(.+?) \| )?\$(\d+\.\d{2}) \|$/);
    if (!row || row[1] === "Item" || row[1].startsWith("---")) continue;
    out.push({ category, name: row[1].trim(), description: row[2] ? row[2].trim() : null, price: Math.round(Number(row[3]) * 100) });
  }
  return out;
}

const source = parseSourceMenu();
const seeded = MENU.flatMap((c) => c.items.map((i) => ({ category: c.name, name: i.name, description: i.description ?? null, price: i.price ?? null, priceNote: i.priceNote })));

describe("menu seed vs source", () => {
  it("has every source row, in the same category, with the same price", () => {
    expect(source.length).toBe(82);
    expect(MENU_ITEM_COUNT).toBe(source.length);
    for (const s of source) {
      const match = seeded.find((x) => x.name === s.name && x.category === s.category);
      expect(match, `${s.category} › ${s.name} missing from seed`).toBeTruthy();
      expect(match!.price, `${s.name} price`).toBe(s.price);
    }
  });
  it("keeps descriptions verbatim (the only edit is moving “solos: $13.65” into the price note)", () => {
    for (const s of source) {
      const match = seeded.find((x) => x.name === s.name && x.category === s.category)!;
      const desc = s.description?.replace(/\s*\(solos: \$13\.65\)$/, (m) => {
        expect(match.priceNote).toBe("Solos: $13.65");
        return "";
      }) ?? null;
      expect(match.description, `${s.name} description`).toBe(desc === "—" ? null : desc);
    }
  });
  it("adds no items that are not in the source", () => {
    for (const x of seeded) expect(source.some((s) => s.name === x.name && s.category === x.category), `${x.name} is not in the source`).toBe(true);
  });
  it("keeps the source category order and notes", () => {
    expect(MENU.map((c) => c.name)).toEqual(["Desayunos", "Platillos", "Comida", "Burritos", "Chimichangas", "Quesadillas", "Pa' los Chamacos", "Extras", "Bebidas", "Postres", "Specials"]);
    expect(MENU.find((c) => c.slug === "desayunos")?.note).toBe("Todos acompañados de frijoles con queso");
    expect(MENU.find((c) => c.slug === "platillos")?.note).toBe("Servidos con arroz y frijoles");
    expect(RESTAURANT.menuNotes).toEqual(["Todos los desayunos son acompañados de frijoles con queso", "Todos los platillos de comida son servidos con arroz y frijoles", "Please call for allergy information"]);
  });
  it("flags the most-mentioned dishes as popular", () => {
    const popular = seeded.filter((_, i) => MENU.flatMap((c) => c.items)[i].popular).map((x) => x.name).sort();
    expect(popular).toEqual(["Burrito Ta Cañón", "Café de la olla", "La Milagrosa", "Menudo", "No Manches", "Pozole"]);
  });
});

describe("restaurant facts vs source", () => {
  it("contact, socials, coordinates and rating match", () => {
    expect(RESTAURANT.name).toBe("RestauranTina");
    expect(RESTAURANT.tagline).toBe("Authentic Mexican Cuisine");
    expect(RESTAURANT.addressLine1).toBe("12115 Montwood Dr Ste 201B");
    expect(`${RESTAURANT.city}, ${RESTAURANT.state} ${RESTAURANT.zip}`).toBe("El Paso, TX 79936");
    expect(md).toContain(RESTAURANT.phonePrimary);
    expect(md).toContain(RESTAURANT.phoneSecondary!);
    expect(RESTAURANT.latitude).toBe(31.7615158);
    expect(RESTAURANT.longitude).toBe(-106.2721195);
    expect(md).toContain(RESTAURANT.instagramUrl);
    expect(md).toContain(RESTAURANT.facebookUrl);
    expect(md).toContain(RESTAURANT.tiktokUrl);
    expect(md).toContain(RESTAURANT.orderingUrl);
    expect(RESTAURANT.rating).toBe("4.7");
    expect(RESTAURANT.reviewCount).toBe(72);
    expect(RESTAURANT.email).toBeNull();
    expect(RESTAURANT.story).toBeNull();
  });
  it("uses the real logo and the three food photos", () => {
    expect(MEDIA.map((m) => m.sourceUrl)).toEqual(expect.arrayContaining([expect.stringContaining("restaurantina-8h2jzfpc-logo.png"), expect.stringContaining("food1.jpg"), expect.stringContaining("food2.jpg"), expect.stringContaining("food3.jpg")]));
  });
  it("seeds the website hours, keeps all three source variants and leaves confirmation to the owner", () => {
    expect(RESTAURANT.hoursConfirmed).toBe(false);
    expect(RESTAURANT.phoneConfirmed).toBe(false);
    const website = SOURCE_HOURS.find((s) => s.key === "website")!;
    for (const r of website.rows) {
      const h = HOURS.find((x) => x.dayOfWeek === r.dayOfWeek)!;
      expect([h.opensAt, h.closesAt]).toEqual([r.opensAt, r.closesAt]);
    }
    expect(SOURCE_HOURS.find((s) => s.key === "google")!.rows.find((r) => r.dayOfWeek === 1)!.isClosed).toBe(true);
    expect(SOURCE_HOURS.find((s) => s.key === "social")!.rows.find((r) => r.dayOfWeek === 0)!.closesAt).toBe("15:00");
    expect(BOOKING_WINDOWS).toHaveLength(7);
  });
});
