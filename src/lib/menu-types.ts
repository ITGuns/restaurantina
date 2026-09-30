import type { DietaryTag, Media } from "@/db/schema";
import type { ItemNode } from "@/lib/data/menu";

/** Serializable slice of a menu item for client components. */
export type MenuItemLite = {
  id: number;
  slug: string;
  name: string;
  spanishName: string | null;
  englishName: string | null;
  description: string | null;
  englishDescription: string | null;
  price: number | null;
  priceNote: string | null;
  image: string | null;
  imageAlt: string | null;
  dietaryTags: DietaryTag[];
  featured: boolean;
  popular: boolean;
  categorySlug: string;
  categoryName: string;
  categoryNote?: string | null;
  availabilityLabel?: string | null;
};

export function toLite(i: ItemNode, extra: Partial<MenuItemLite> = {}): MenuItemLite {
  return {
    id: i.id,
    slug: i.slug,
    name: i.name,
    spanishName: i.spanishName,
    englishName: i.englishName,
    description: i.description,
    englishDescription: i.englishDescription,
    price: i.price,
    priceNote: i.priceNote,
    image: i.image,
    imageAlt: i.imageAlt,
    dietaryTags: i.dietaryTags,
    featured: i.featured,
    popular: i.popular,
    categorySlug: i.categorySlug,
    categoryName: i.categoryName,
    ...extra,
  };
}

/** Serializable slice of a media row. */
export type MediaLite = { id: number; file: string; alt: string; caption: string | null; width: number; height: number; focalX: number; focalY: number; tag: string };

export function toMediaLite(m: Media): MediaLite {
  return { id: m.id, file: m.file, alt: m.alt, caption: m.caption, width: m.width, height: m.height, focalX: m.focalX, focalY: m.focalY, tag: m.tag };
}

/** Find the media row for a file path (for focal point + alt), or wrap a bare path. */
export function mediaForFile(list: Media[], file: string | null | undefined, fallbackAlt: string): MediaLite | null {
  if (!file) return null;
  const found = list.find((m) => m.file === file);
  if (found) return toMediaLite(found);
  return { id: 0, file, alt: fallbackAlt, caption: null, width: 1000, height: 1000, focalX: 50, focalY: 50, tag: "other" };
}
