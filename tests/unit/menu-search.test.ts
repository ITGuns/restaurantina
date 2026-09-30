import { describe, expect, it } from "vitest";
import type { CategoryNode, ItemNode } from "@/lib/data/menu";
import { applyFilters, EMPTY_FILTERS, itemMatches } from "@/components/menu/menu-filter";

const item = (over: Partial<ItemNode>): ItemNode => ({
  id: 1, categoryId: 1, name: "No Manches", spanishName: null, englishName: null, slug: "no-manches", description: "Enchiladas de chipotle", englishDescription: null, price: 1785, priceNote: null, image: null, imageAlt: null,
  dietaryTags: [], availabilityNote: null, notes: null, featured: true, popular: true, active: true, displayOrder: 0, createdAt: "", updatedAt: "",
  categorySlug: "comida", categoryName: "Comida", availability: [], modifierGroups: [], ...over,
});
const cat = (items: ItemNode[], over: Partial<CategoryNode> = {}): CategoryNode => ({ id: 1, name: "Comida", englishName: "Lunch", slug: "comida", description: null, englishDescription: null, note: null, englishNote: null, image: null, displayOrder: 0, active: true, createdAt: "", updatedAt: "", items, ...over });

describe("menu search", () => {
  const items = [
    item({ id: 1 }),
    item({ id: 2, name: "Ta Cañón", slug: "ta-canon", description: "Chile relleno de queso", featured: false, popular: false }),
    item({ id: 3, name: "El Argüendero", slug: "el-arguendero", description: "Pollo en mole", englishDescription: "Chicken in mole sauce", englishName: "Chicken mole", featured: false, popular: false, dietaryTags: ["spicy"] }),
  ];
  const none = {};
  it("matches Spanish names, descriptions and category, accent-insensitively", () => {
    expect(itemMatches(items[0], { ...EMPTY_FILTERS, query: "enchilada" }, none)).toBe(true);
    expect(itemMatches(items[1], { ...EMPTY_FILTERS, query: "ta canon" }, none)).toBe(true);
    expect(itemMatches(items[2], { ...EMPTY_FILTERS, query: "arguendero" }, none)).toBe(true);
    expect(itemMatches(items[2], { ...EMPTY_FILTERS, query: "lunch" }, none)).toBe(false); // english category name is shown, not searched via categoryName
    expect(itemMatches(items[0], { ...EMPTY_FILTERS, query: "comida" }, none)).toBe(true);
  });
  it("matches English names and descriptions when the owner adds them", () => {
    expect(itemMatches(items[2], { ...EMPTY_FILTERS, query: "chicken mole" }, none)).toBe(true);
    expect(itemMatches(items[2], { ...EMPTY_FILTERS, query: "mole sauce" }, none)).toBe(true);
  });
  it("filters by popular, featured, dietary and availability", () => {
    expect(applyFilters([cat(items)], { ...EMPTY_FILTERS, popular: true }, none)[0].items.map((i) => i.id)).toEqual([1]);
    expect(applyFilters([cat(items)], { ...EMPTY_FILTERS, dietary: ["spicy"] }, none)[0].items.map((i) => i.id)).toEqual([3]);
    const avail = { 2: { availableNow: true, availableToday: true, label: null, detail: null } };
    expect(applyFilters([cat(items)], { ...EMPTY_FILTERS, availableNow: true }, avail)[0].items.map((i) => i.id)).toEqual([2]);
  });
  it("returns counts per category", () => {
    const res = applyFilters([cat(items)], { ...EMPTY_FILTERS, query: "zzz" }, none);
    expect(res[0].itemCount).toBe(0);
  });
});
