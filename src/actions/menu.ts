"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { nextOrder, reorderRows } from "@/lib/data/order";
import { revalidateMenu } from "@/lib/revalidate";
import { slugify } from "@/lib/slug";
import { categoryInput, fieldErrors, menuItemInput, modifierGroupInput, modifierInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { menuCategories, menuItems, menuAvailability, modifierGroups, modifiers, menuItemModifierGroups } = schema;
const now = () => new Date().toISOString();

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = slugify(base) || "item";
  let i = 2;
  while (await exists(slug)) slug = `${slugify(base) || "item"}-${i++}`;
  return slug;
}

/* ---------------- Categories ---------------- */

export async function saveCategory(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const parsed = categoryInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const d = parsed.data;
  const values = {
    name: d.name,
    englishName: d.englishName ?? null,
    description: d.description ?? null,
    englishDescription: d.englishDescription ?? null,
    note: d.note ?? null,
    englishNote: d.englishNote ?? null,
    image: d.image ?? null,
    active: d.active,
    updatedAt: now(),
  };
  if (d.id) {
    await db.update(menuCategories).set(values).where(eq(menuCategories.id, d.id));
    revalidateMenu();
    return { ok: true, data: { id: d.id } };
  }
  const slug = await uniqueSlug(d.slug || d.name, async (s) => (await db.select({ id: menuCategories.id }).from(menuCategories).where(eq(menuCategories.slug, s)).limit(1)).length > 0);
  const [row] = await db.insert(menuCategories).values({ ...values, slug, displayOrder: await nextOrder("menu_categories") }).returning({ id: menuCategories.id });
  revalidateMenu();
  return { ok: true, data: { id: row.id } };
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(menuCategories).where(eq(menuCategories.id, id));
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function reorderCategories(ids: number[]): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await reorderRows("menu_categories", ids);
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function setCategoryFlag(id: number, active: boolean): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.update(menuCategories).set({ active, updatedAt: now() }).where(eq(menuCategories.id, id));
  revalidateMenu();
  return { ok: true, data: undefined };
}

/* ---------------- Items ---------------- */

export async function saveMenuItem(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const parsed = menuItemInput.safeParse(raw);
  if (!parsed.success) return fail("We couldn't save your menu item. Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const d = parsed.data;
  const [cat] = await db.select({ id: menuCategories.id }).from(menuCategories).where(eq(menuCategories.id, d.categoryId)).limit(1);
  if (!cat) return fail("Choose a category.", { fieldErrors: { categoryId: "Choose a category" } });
  const values = {
    categoryId: d.categoryId,
    name: d.name,
    spanishName: d.spanishName ?? null,
    englishName: d.englishName ?? null,
    description: d.description ?? null,
    englishDescription: d.englishDescription ?? null,
    price: d.price,
    priceNote: d.priceNote ?? null,
    image: d.image ?? null,
    imageAlt: d.imageAlt ?? null,
    dietaryTags: d.dietaryTags,
    availabilityNote: d.availabilityNote ?? null,
    notes: d.notes ?? null,
    featured: d.featured,
    popular: d.popular,
    active: d.active,
    updatedAt: now(),
  };

  try {
    const id = await db.transaction(async (tx) => {
      let itemId = d.id;
      if (itemId) {
        const [existing] = await tx.select({ categoryId: menuItems.categoryId }).from(menuItems).where(eq(menuItems.id, itemId)).limit(1);
        if (!existing) throw new Error("NOT_FOUND");
        const moved = existing.categoryId !== d.categoryId;
        const { rows } = moved ? await tx.execute<{ m: number }>(sql`select coalesce(max(display_order), -1)::int as m from menu_items where category_id = ${d.categoryId}`) : { rows: [] as { m: number }[] };
        await tx
          .update(menuItems)
          .set(moved ? { ...values, displayOrder: (rows[0]?.m ?? -1) + 1 } : values)
          .where(eq(menuItems.id, itemId));
      } else {
        const slug = await uniqueSlug(d.slug || d.name, async (s) => (await tx.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.slug, s)).limit(1)).length > 0);
        const { rows } = await tx.execute<{ m: number }>(sql`select coalesce(max(display_order), -1)::int as m from menu_items where category_id = ${d.categoryId}`);
        const [row] = await tx.insert(menuItems).values({ ...values, slug, displayOrder: (rows[0]?.m ?? -1) + 1 }).returning({ id: menuItems.id });
        itemId = row.id;
      }
      await tx.delete(menuAvailability).where(eq(menuAvailability.itemId, itemId));
      const windows = d.availability.filter((w) => w.days.length || w.startTime || w.endTime);
      if (windows.length) {
        await tx.insert(menuAvailability).values(windows.map((w) => ({ itemId: itemId!, days: w.days, startTime: w.startTime ?? null, endTime: w.endTime ?? null, active: w.active })));
      }
      await tx.delete(menuItemModifierGroups).where(eq(menuItemModifierGroups.itemId, itemId));
      if (d.modifierGroupIds.length) {
        await tx.insert(menuItemModifierGroups).values(d.modifierGroupIds.map((groupId, i) => ({ itemId: itemId!, groupId, displayOrder: i })));
      }
      return itemId;
    });
    revalidateMenu();
    return { ok: true, data: { id } };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") return fail("That item no longer exists.");
    console.error("saveMenuItem failed", err);
    return fail("We couldn't save your menu item. Please try again.");
  }
}

export async function deleteMenuItem(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(menuItems).where(eq(menuItems.id, id));
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function setItemFlag(id: number, field: "active" | "featured" | "popular", value: boolean): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  if (!["active", "featured", "popular"].includes(field)) return fail("Unknown flag.");
  await db.update(menuItems).set({ [field]: value, updatedAt: now() }).where(eq(menuItems.id, id));
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function updateItemPrice(id: number, price: string | number | null): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = menuItemInput.shape.price.safeParse(price);
  if (!parsed.success) return fail("Enter a valid price.");
  await db.update(menuItems).set({ price: parsed.data, updatedAt: now() }).where(eq(menuItems.id, id));
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function reorderItems(categoryId: number, ids: number[]): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await reorderRows("menu_items", ids, sql`, category_id = ${categoryId}`);
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function duplicateMenuItem(id: number): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const [src] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  if (!src) return fail("Item not found.");
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src;
  const slug = await uniqueSlug(`${src.name} copy`, async (s) => (await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.slug, s)).limit(1)).length > 0);
  const [row] = await db
    .insert(menuItems)
    .values({ ...rest, name: `${src.name} (copy)`, slug, active: false, featured: false, popular: false, displayOrder: src.displayOrder + 1 })
    .returning({ id: menuItems.id });
  const [links, windows] = await Promise.all([
    db.select().from(menuItemModifierGroups).where(eq(menuItemModifierGroups.itemId, id)),
    db.select().from(menuAvailability).where(eq(menuAvailability.itemId, id)),
  ]);
  if (links.length) await db.insert(menuItemModifierGroups).values(links.map((l) => ({ ...l, itemId: row.id })));
  if (windows.length) await db.insert(menuAvailability).values(windows.map((w) => ({ itemId: row.id, days: w.days, startTime: w.startTime, endTime: w.endTime, active: w.active })));
  revalidateMenu();
  return { ok: true, data: { id: row.id } };
}

/* ---------------- Modifier groups + modifiers ---------------- */

export async function saveModifierGroup(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const parsed = modifierGroupInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const d = parsed.data;
  if (d.maxSelections < d.minSelections) return fail("Max selections must be ≥ min selections.", { fieldErrors: { maxSelections: "Must be ≥ min" } });
  const values = { name: d.name, description: d.description ?? null, required: d.required, minSelections: d.minSelections, maxSelections: d.maxSelections, active: d.active, updatedAt: now() };
  if (d.id) {
    await db.update(modifierGroups).set(values).where(eq(modifierGroups.id, d.id));
    revalidateMenu();
    return { ok: true, data: { id: d.id } };
  }
  const [row] = await db.insert(modifierGroups).values({ ...values, key: slugify(d.name), displayOrder: await nextOrder("modifier_groups") }).returning({ id: modifierGroups.id });
  revalidateMenu();
  return { ok: true, data: { id: row.id } };
}

export async function deleteModifierGroup(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(modifierGroups).where(eq(modifierGroups.id, id));
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function saveModifier(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const parsed = modifierInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const d = parsed.data;
  const values = { groupId: d.groupId, name: d.name, description: d.description ?? null, priceAdjustment: d.priceAdjustment, active: d.active, updatedAt: now() };
  if (d.id) {
    await db.update(modifiers).set(values).where(eq(modifiers.id, d.id));
    revalidateMenu();
    return { ok: true, data: { id: d.id } };
  }
  const displayOrder = await nextOrder("modifiers", sql` where group_id = ${d.groupId}`);
  const [row] = await db.insert(modifiers).values({ ...values, displayOrder }).returning({ id: modifiers.id });
  revalidateMenu();
  return { ok: true, data: { id: row.id } };
}

export async function deleteModifier(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(modifiers).where(eq(modifiers.id, id));
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function itemSlugExists(slug: string, exceptId?: number): Promise<boolean> {
  await requireAdmin();
  const rows = await db
    .select({ id: menuItems.id })
    .from(menuItems)
    .where(exceptId ? and(eq(menuItems.slug, slug), ne(menuItems.id, exceptId)) : eq(menuItems.slug, slug))
    .limit(1);
  return rows.length > 0;
}
