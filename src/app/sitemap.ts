import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { flattenItems, getMenuTree } from "@/lib/data/menu";
import { getMedia } from "@/lib/data/media";
import { getBookingSettings, getRestaurant } from "@/lib/data/restaurant";
import { parsePgTimestamp } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Newest timestamp among the given rows, so <lastmod> reflects real content changes. */
function latest(...stamps: (string | null | undefined)[]): Date {
  const times = stamps.filter((s): s is string => Boolean(s)).map((s) => parsePgTimestamp(s).getTime()).filter(Number.isFinite);
  return new Date(times.length ? Math.max(...times) : 0);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [r, tree, media, settings] = await Promise.all([getRestaurant(), getMenuTree(), getMedia(), getBookingSettings()]);
  const items = flattenItems(tree);
  const menuMod = latest(r.updatedAt, ...tree.categories.map((c) => c.updatedAt), ...items.map((i) => i.updatedAt));
  const galleryMod = latest(r.updatedAt, ...media.map((m) => m.updatedAt));
  const homeMod = latest(menuMod.toISOString(), galleryMod.toISOString());
  return [
    { url: `${SITE_URL}/`, lastModified: homeMod, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/menu`, lastModified: menuMod, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/book`, lastModified: latest(r.updatedAt, settings.updatedAt), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/gallery`, lastModified: galleryMod, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/visit`, lastModified: latest(r.updatedAt), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: latest(r.updatedAt), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: latest(r.updatedAt), changeFrequency: "yearly", priority: 0.2 },
  ];
}
