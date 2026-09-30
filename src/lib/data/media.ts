import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, schema } from "@/db";
import type { Media } from "@/db/schema";
import { CONTENT_TAG } from "./restaurant";

const { media } = schema;

export async function readMedia(includeInactive = false): Promise<Media[]> {
  const rows = await db.select().from(media).orderBy(asc(media.displayOrder), asc(media.id));
  return includeInactive ? rows : rows.filter((m) => m.active);
}

export async function readMediaById(id: number): Promise<Media | undefined> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row;
}

/** Active media, cached for the public site. */
export const getMedia = cache(unstable_cache(() => readMedia(false), ["media"], { tags: [CONTENT_TAG] }));

export const getGallery = cache(async (): Promise<Media[]> => (await getMedia()).filter((m) => m.inGallery));

/**
 * The photo to use for a tag's section imagery: the first one marked featured
 * (Admin → Media → "Prefer this photo for section imagery"), else the first by
 * display order. `skip` excludes files already used nearby.
 */
export function pickPhoto<T extends Pick<Media, "tag" | "file" | "featured">>(list: T[], tag: string, skip: string[] = []): T | undefined {
  const candidates = list.filter((m) => m.tag === tag && !skip.includes(m.file));
  return candidates.find((m) => m.featured) ?? candidates[0];
}

/** object-position for a media row's focal point */
export function focal(m: Pick<Media, "focalX" | "focalY">): string {
  return `${m.focalX}% ${m.focalY}%`;
}
