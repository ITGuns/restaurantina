import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, schema } from "@/db";
import type { MenuAvailability, MenuCategory, MenuItem, Modifier, ModifierGroup } from "@/db/schema";

const { menuCategories, menuItems, menuAvailability, modifierGroups, modifiers, menuItemModifierGroups } = schema;

export const MENU_TAG = "menu";

export type GroupNode = ModifierGroup & { modifiers: Modifier[] };
export type ItemNode = MenuItem & { categorySlug: string; categoryName: string; availability: MenuAvailability[]; modifierGroups: GroupNode[] };
export type CategoryNode = MenuCategory & { items: ItemNode[] };
export type MenuTree = { categories: CategoryNode[]; groups: GroupNode[] };

export async function readModifierGroups(includeInactive = false): Promise<GroupNode[]> {
  const [groups, mods] = await Promise.all([
    db.select().from(modifierGroups).orderBy(asc(modifierGroups.displayOrder), asc(modifierGroups.id)),
    db.select().from(modifiers).orderBy(asc(modifiers.displayOrder), asc(modifiers.id)),
  ]);
  return groups
    .filter((g) => includeInactive || g.active)
    .map((g) => ({ ...g, modifiers: mods.filter((m) => m.groupId === g.id && (includeInactive || m.active)) }));
}

export async function readMenuTree(includeInactive = false): Promise<MenuTree> {
  const [cats, items, windows, links, groups] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.displayOrder), asc(menuCategories.id)),
    db.select().from(menuItems).orderBy(asc(menuItems.displayOrder), asc(menuItems.id)),
    db.select().from(menuAvailability).orderBy(asc(menuAvailability.id)),
    db.select().from(menuItemModifierGroups).orderBy(asc(menuItemModifierGroups.displayOrder)),
    readModifierGroups(includeInactive),
  ]);
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const categories: CategoryNode[] = cats
    .filter((c) => includeInactive || c.active)
    .map((c) => ({
      ...c,
      items: items
        .filter((i) => i.categoryId === c.id && (includeInactive || i.active))
        .map((i) => ({
          ...i,
          categorySlug: c.slug,
          categoryName: c.name,
          availability: windows.filter((w) => w.itemId === i.id),
          modifierGroups: links
            .filter((l) => l.itemId === i.id)
            .map((l) => groupById.get(l.groupId))
            .filter((g): g is GroupNode => Boolean(g)),
        })),
    }));

  return { categories, groups };
}

export function flattenItems(tree: MenuTree): ItemNode[] {
  return tree.categories.flatMap((c) => c.items);
}

export async function readItem(id: number): Promise<ItemNode | null> {
  return flattenItems(await readMenuTree(true)).find((i) => i.id === id) ?? null;
}

export async function readCategories(): Promise<MenuCategory[]> {
  return db.select().from(menuCategories).orderBy(asc(menuCategories.displayOrder));
}

export async function readItemRow(id: number): Promise<MenuItem | undefined> {
  const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  return row;
}

/* Cached public reads */
export const getMenuTree = cache(unstable_cache(() => readMenuTree(false), ["menu-tree"], { tags: [MENU_TAG] }));

export const getFeaturedItems = cache(async (): Promise<ItemNode[]> => flattenItems(await getMenuTree()).filter((i) => i.featured));
export const getPopularItems = cache(async (): Promise<ItemNode[]> => flattenItems(await getMenuTree()).filter((i) => i.popular));
