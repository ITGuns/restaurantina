import type { Metadata } from "next";
import { GalleryExplorer } from "@/components/gallery/GalleryExplorer";
import { Flourish } from "@/components/site/Talavera";
import { getGallery } from "@/lib/data/media";
import { getRestaurant } from "@/lib/data/restaurant";
import { toMediaLite } from "@/lib/menu-types";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const r = await getRestaurant();
  return pageMeta(r, { title: "Gallery", description: `Photos from ${r.name}: home-style Mexican dishes on Talavera-style clay plates in ${r.city}, ${r.state}.`, path: "/gallery" });
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ photo?: string }> }) {
  const [gallery, { photo }] = await Promise.all([getGallery(), searchParams]);
  const images = gallery.map(toMediaLite);
  const initial = photo && images.some((i) => i.id === Number(photo)) ? Number(photo) : undefined;
  return (
    <>
      <section className="relative overflow-hidden bg-brown-950 pb-10 pt-32 text-cream-50 md:pt-40">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.07]" />
        <div className="container-site relative z-[2]">
          <Flourish tone="mostaza" />
          <p className="mt-4 eyebrow text-mostaza-400">Gallery</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] leading-[0.95] tracking-[-0.01em]">
            Platos, jarritos <em className="italic text-mostaza-300">y Talavera.</em>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/70">{images.length} photos. Tap any one to open it full screen.</p>
        </div>
      </section>
      <GalleryExplorer images={images} initialPhoto={initial} />
    </>
  );
}
