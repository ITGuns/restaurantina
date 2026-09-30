import Image from "next/image";
import Link from "next/link";
import { DragCarousel } from "@/components/motion/DragCarousel";
import { Flourish } from "@/components/site/Talavera";
import { Reveal } from "@/components/ui/Reveal";
import type { MediaLite } from "@/lib/menu-types";

/** Horizontal, swipeable strip of the restaurant's photography. Each card opens the gallery lightbox. */
export function FoodCarousel({ images }: { images: MediaLite[] }) {
  if (!images.length) return null;
  const slides = images.length < 4 ? [...images, ...images] : images;
  return (
    <section aria-labelledby="carousel-title" className="overflow-hidden bg-cream-50 py-20 lg:py-28">
      <div className="container-site flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <Flourish />
          <p className="mt-4 eyebrow text-clay-600">From the kitchen</p>
          <h2 id="carousel-title" className="mt-4 font-display text-[clamp(2.3rem,4.6vw,4rem)] leading-[1] text-brown-900">
            Swipe through <em className="italic text-clay-600">the plates.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Link href="/gallery" className="group/btn inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-brown-800 hover:text-brown-950">
            All photos <span className="transition-transform group-hover/btn:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
      <div className="mt-10">
        <DragCarousel ariaLabel="Food photos" tone="light" trackClassName="px-5 scroll-px-5 sm:px-8 sm:scroll-px-8 lg:px-12 lg:scroll-px-12">
          {slides.map((img, i) => (
            <li key={`${img.id}-${i}`} className="w-[78vw] shrink-0 snap-start sm:w-[420px] lg:w-[480px]">
              <Link href={`/gallery?photo=${img.id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[26px] bg-cream-200 shadow-card sm:aspect-square">
                <Image src={img.file} alt={img.alt} fill sizes="(min-width: 1024px) 480px, (min-width: 640px) 420px, 78vw" loading={i < 2 ? "eager" : "lazy"} className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.06]" style={{ objectPosition: `${img.focalX}% ${img.focalY}%` }} />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute inset-x-5 bottom-5 translate-y-2 text-[14px] font-medium leading-snug text-cream-50 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">{img.caption ?? img.alt}</span>
              </Link>
            </li>
          ))}
        </DragCarousel>
      </div>
    </section>
  );
}
