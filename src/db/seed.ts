/* eslint-disable no-console */
import { config as loadEnv } from "dotenv";
import { sql } from "drizzle-orm";
import { MENU } from "./seed-data/menu";
import { BOOKING_SETTINGS, BOOKING_WINDOWS, HOURS, MEDIA, MODIFIER_GROUPS, RESTAURANT, mediaSeedRows } from "./seed-data/restaurant";
import { hashPassword } from "../lib/password";
import { slugify } from "../lib/slug";

loadEnv({ path: ".env.local" });
loadEnv();

const CONTENT_TABLES = ["menu_item_modifier_groups", "menu_availability", "menu_items", "menu_categories", "modifiers", "modifier_groups", "hours", "booking_windows", "media", "restaurant_info", "booking_settings"];

async function main() {
  // Imported after env is loaded so DATABASE_URL is available to the client.
  const { db, schema } = await import("./index");
  const { adminUsers, bookingSettings, bookingWindows, hours, media, menuAvailability, menuCategories, menuItemModifierGroups, menuItems, modifierGroups, modifiers, restaurantInfo } = schema;

  const force = process.argv.includes("--force");
  const wipeReservations = process.argv.includes("--reservations");
  const existing = await db.select({ id: menuCategories.id }).from(menuCategories).limit(1);
  if (existing.length && !force) {
    console.log("Database already seeded. Run `npm run db:reseed` to wipe menu/content tables and re-seed (reservations are kept), or `npm run db:reset` to wipe reservations too.");
    await seedAdmin(db, adminUsers);
    process.exit(0);
  }

  await db.transaction(async (tx) => {
    if (force) {
      for (const t of CONTENT_TABLES) await tx.execute(sql.raw(`DELETE FROM ${t}`));
      if (wipeReservations) {
        await tx.execute(sql.raw("DELETE FROM reservations"));
        await tx.execute(sql.raw("DELETE FROM date_overrides"));
      }
    }

    /* ---- restaurant + hours + booking ---- */
    await tx.insert(restaurantInfo).values(RESTAURANT);
    await tx.insert(hours).values(HOURS.map((h) => ({ ...h, isClosed: h.isClosed ?? false })));
    await tx.insert(bookingSettings).values(BOOKING_SETTINGS);
    await tx.insert(bookingWindows).values(BOOKING_WINDOWS);

    /* ---- modifier groups ---- */
    const groupIdByKey = new Map<string, number>();
    for (const [gi, g] of MODIFIER_GROUPS.entries()) {
      const [row] = await tx
        .insert(modifierGroups)
        .values({ key: g.key, name: g.name, description: g.description, required: g.required ?? false, minSelections: g.min ?? 0, maxSelections: g.max ?? 1, displayOrder: gi })
        .returning({ id: modifierGroups.id });
      groupIdByKey.set(g.key, row.id);
      if (g.modifiers.length) {
        await tx.insert(modifiers).values(g.modifiers.map((m, mi) => ({ groupId: row.id, name: m.name, description: m.description, priceAdjustment: m.price ?? 0, displayOrder: mi })));
      }
    }

    /* ---- menu ---- */
    const usedSlugs = new Set<string>();
    let items = 0;
    for (const [ci, cat] of MENU.entries()) {
      const [catRow] = await tx
        .insert(menuCategories)
        .values({
          name: cat.name,
          englishName: cat.englishName ?? null,
          slug: cat.slug,
          description: cat.description ?? null,
          englishDescription: cat.englishDescription ?? null,
          note: cat.note ?? null,
          englishNote: cat.englishNote ?? null,
          image: cat.image ?? null,
          displayOrder: ci,
        })
        .returning({ id: menuCategories.id });

      for (const [ii, it] of cat.items.entries()) {
        let slug = it.slug ?? slugify(it.name);
        if (usedSlugs.has(slug)) slug = `${slug}-${cat.slug}`;
        if (usedSlugs.has(slug)) throw new Error(`Duplicate slug ${slug}`);
        usedSlugs.add(slug);

        const [itemRow] = await tx
          .insert(menuItems)
          .values({
            categoryId: catRow.id,
            name: it.name,
            spanishName: it.spanishName ?? null,
            englishName: it.englishName ?? null,
            slug,
            description: it.description ?? null,
            englishDescription: it.englishDescription ?? null,
            price: it.price ?? null,
            priceNote: it.priceNote ?? null,
            image: it.image ?? null,
            imageAlt: it.imageAlt ?? null,
            dietaryTags: it.dietary ?? [],
            availabilityNote: it.availabilityNote ?? null,
            notes: it.notes ?? null,
            featured: it.featured ?? false,
            popular: it.popular ?? false,
            displayOrder: ii,
          })
          .returning({ id: menuItems.id });
        items++;

        if (it.availability?.length) {
          await tx.insert(menuAvailability).values(it.availability.map((a) => ({ itemId: itemRow.id, days: a.days ?? [], startTime: a.start ?? null, endTime: a.end ?? null })));
        }
        const links = (it.modifierGroups ?? []).map((key, gi) => {
          const groupId = groupIdByKey.get(key);
          if (!groupId) throw new Error(`Unknown modifier group ${key} on ${it.name}`);
          return { itemId: itemRow.id, groupId, displayOrder: gi };
        });
        if (links.length) await tx.insert(menuItemModifierGroups).values(links);
      }
    }

    /* ---- media ---- */
    await tx.insert(media).values(mediaSeedRows());

    console.log(`Seeded: ${MENU.length} categories, ${items} items, ${MODIFIER_GROUPS.length} modifier groups, ${HOURS.length} hours rows, ${BOOKING_WINDOWS.length} booking windows, ${MEDIA.length} media items.`);
  });

  await seedAdmin(db, adminUsers);
  process.exit(0);
}

type SeedDb = Awaited<ReturnType<typeof importDb>>["db"];
type AdminTable = Awaited<ReturnType<typeof importDb>>["schema"]["adminUsers"];
const importDb = () => import("./index");

async function seedAdmin(db: SeedDb, adminUsers: AdminTable) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set. Skipping admin user. Set them in .env.local and re-run `npm run db:seed`.");
    return;
  }
  const found = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  if (found.length) {
    console.log("Admin user already exists. Skipping.");
    return;
  }
  await db.insert(adminUsers).values({ email: email.toLowerCase(), name: process.env.ADMIN_NAME ?? "Owner", passwordHash: hashPassword(password) });
  console.log(`Admin user created: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
