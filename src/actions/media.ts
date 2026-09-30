"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Media, MediaTag } from "@/db/schema";
import { MEDIA_TAGS } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nextOrder, reorderRows } from "@/lib/data/order";
import { imageSize } from "@/lib/image-size";
import { revalidateContent, revalidateMenu } from "@/lib/revalidate";
import { fieldErrors, mediaInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { media, uploads, menuItems, menuCategories, restaurantInfo } = schema;
const now = () => new Date().toISOString();

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MIN_EDGE = 200;
const MAX_EDGE = 8000;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/** Validates + stores an uploaded image (type, size, real pixel dimensions), returning its public path. */
async function storeUpload(file: unknown): Promise<{ ok: true; path: string; width: number; height: number; name: string } | { ok: false; error: string }> {
  if (!(file instanceof File)) return { ok: false, error: "Choose an image to upload." };
  const ext = ALLOWED.get(file.type);
  if (!ext) return { ok: false, error: "Use a JPG, PNG or WebP image." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `Image must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` };
  const data = Buffer.from(await file.arrayBuffer());
  const size = imageSize(data, file.type);
  if (!size) return { ok: false, error: "That file doesn't look like a valid image." };
  if (size.width < MIN_EDGE || size.height < MIN_EDGE) return { ok: false, error: `Image must be at least ${MIN_EDGE}×${MIN_EDGE} pixels.` };
  if (size.width > MAX_EDGE || size.height > MAX_EDGE) return { ok: false, error: `Image must be at most ${MAX_EDGE} pixels on each side.` };
  const name = `${randomUUID()}${ext}`;
  await db.insert(uploads).values({ name, mime: file.type, size: data.length, data });
  return { ok: true, path: `/uploads/${name}`, width: size.width, height: size.height, name };
}

async function deleteUploadFor(path: string | null | undefined) {
  const m = path?.match(/^\/uploads\/([a-zA-Z0-9._-]+)$/);
  if (m) await db.delete(uploads).where(eq(uploads.name, m[1]));
}

/**
 * Upload a new image into the library. Form fields: file (required), alt, tag,
 * inGallery ("0" to keep it out of the public gallery, e.g. menu item photos).
 */
export async function uploadMedia(formData: FormData): Promise<ActionResult<Media>> {
  const g = await guard();
  if (g) return g;
  const stored = await storeUpload(formData.get("file"));
  if (!stored.ok) return fail(stored.error);
  const tagRaw = String(formData.get("tag") ?? "other");
  const tag = (MEDIA_TAGS as readonly string[]).includes(tagRaw) ? (tagRaw as MediaTag) : "other";
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200) || String((formData.get("file") as File).name).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
  const inGallery = formData.get("inGallery") !== "0";
  const [row] = await db
    .insert(media)
    .values({ file: stored.path, alt, tag, width: stored.width, height: stored.height, inGallery, displayOrder: await nextOrder("media") })
    .returning();
  revalidateContent();
  return { ok: true, data: row };
}

/** Replace the file behind an existing media row (keeps alt, tag, ordering and every place that uses it). */
export async function replaceMediaFile(id: number, formData: FormData): Promise<ActionResult<Media>> {
  const g = await guard();
  if (g) return g;
  const [existing] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!existing) return fail("Image not found.");
  const stored = await storeUpload(formData.get("file"));
  if (!stored.ok) return fail(stored.error);
  const [row] = await db.transaction(async (tx) => {
    const updated = await tx.update(media).set({ file: stored.path, width: stored.width, height: stored.height, updatedAt: now() }).where(eq(media.id, id)).returning();
    // Repoint everything that referenced the old file so the swap is seamless.
    await tx.update(menuItems).set({ image: stored.path }).where(eq(menuItems.image, existing.file));
    await tx.update(menuCategories).set({ image: stored.path }).where(eq(menuCategories.image, existing.file));
    await tx.update(restaurantInfo).set({ heroImage: stored.path }).where(eq(restaurantInfo.heroImage, existing.file));
    await tx.update(restaurantInfo).set({ ogImageUrl: stored.path }).where(eq(restaurantInfo.ogImageUrl, existing.file));
    return updated;
  });
  await deleteUploadFor(existing.file);
  revalidateContent();
  revalidateMenu();
  return { ok: true, data: row };
}

export async function saveMedia(raw: unknown): Promise<ActionResult<Media>> {
  const g = await guard();
  if (g) return g;
  const parsed = mediaInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const d = parsed.data;
  const [row] = await db
    .update(media)
    .set({ alt: d.alt, caption: d.caption ?? null, tag: d.tag, focalX: d.focalX, focalY: d.focalY, featured: d.featured, inGallery: d.inGallery, active: d.active, updatedAt: now() })
    .where(eq(media.id, d.id))
    .returning();
  if (!row) return fail("Image not found.");
  revalidateContent();
  revalidateMenu();
  return { ok: true, data: row };
}

export async function deleteMedia(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const [existing] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!existing) return fail("Image not found.");
  await db.transaction(async (tx) => {
    await tx.delete(media).where(eq(media.id, id));
    // Clear every reference so nothing on the site points at a file that no longer exists.
    await tx.update(menuItems).set({ image: null, imageAlt: null, updatedAt: now() }).where(eq(menuItems.image, existing.file));
    await tx.update(menuCategories).set({ image: null, updatedAt: now() }).where(eq(menuCategories.image, existing.file));
    await tx.update(restaurantInfo).set({ heroImage: null, updatedAt: now() }).where(eq(restaurantInfo.heroImage, existing.file));
    await tx.update(restaurantInfo).set({ ogImageUrl: null, updatedAt: now() }).where(eq(restaurantInfo.ogImageUrl, existing.file));
    await tx.update(restaurantInfo).set({ logo: null, updatedAt: now() }).where(eq(restaurantInfo.logo, existing.file));
  });
  await deleteUploadFor(existing.file);
  revalidateContent();
  revalidateMenu();
  return { ok: true, data: undefined };
}

export async function reorderMedia(ids: number[]): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  await reorderRows("media", ids);
  revalidateContent();
  return { ok: true, data: undefined };
}

export type AssignTarget = { type: "item"; itemId: number } | { type: "category"; categoryId: number } | { type: "hero" } | { type: "og" };

/** Point a menu item, category, the hero or the share image at a library photo. */
export async function assignMedia(mediaId: number, target: AssignTarget): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const [m] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (!m) return fail("Image not found.");
  switch (target.type) {
    case "item": {
      const [row] = await db.update(menuItems).set({ image: m.file, imageAlt: m.alt, updatedAt: now() }).where(eq(menuItems.id, Number(target.itemId))).returning({ id: menuItems.id });
      if (!row) return fail("Menu item not found.");
      break;
    }
    case "category": {
      const [row] = await db.update(menuCategories).set({ image: m.file, updatedAt: now() }).where(eq(menuCategories.id, Number(target.categoryId))).returning({ id: menuCategories.id });
      if (!row) return fail("Category not found.");
      break;
    }
    case "hero":
      await db.update(restaurantInfo).set({ heroImage: m.file, heroImageAlt: m.alt, updatedAt: now() }).where(eq(restaurantInfo.id, 1));
      break;
    case "og":
      await db.update(restaurantInfo).set({ ogImageUrl: m.file, updatedAt: now() }).where(eq(restaurantInfo.id, 1));
      break;
    default:
      return fail("Unknown target.");
  }
  revalidateContent();
  revalidateMenu();
  return { ok: true, data: undefined };
}
