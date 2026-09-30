import type { Metadata } from "next";
import type { RestaurantInfo } from "@/db/schema";

/**
 * Per-page metadata. Next.js does not deep-merge `openGraph` / `twitter` from the
 * layout, so every page rebuilds them here with its own title, description and URL.
 */
export function pageMeta(
  r: Pick<RestaurantInfo, "name" | "ogImageUrl" | "tagline">,
  { title, description, path, absoluteTitle = false }: { title: string; description: string; path: string; absoluteTitle?: boolean },
): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${r.name}`;
  const images = r.ogImageUrl ? [{ url: r.ogImageUrl, alt: `${r.name} — ${r.tagline}` }] : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: r.name, locale: "en_US", title: fullTitle, description, url: path, images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}
