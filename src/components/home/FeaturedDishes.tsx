import Link from "next/link";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Flourish } from "@/components/site/Talavera";
import { ButtonLink } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { money } from "@/lib/format";
import type { MediaLite, MenuItemLite } from "@/lib/menu-types";

export function FeaturedDishes({ items, image }: { items: MenuItemLite[]; image: MediaLite | null }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="featured-title" className="relative overflow-hidden bg-brown-950 py-20 text-cream-50 lg:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.06]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-clay-600/20 blur-3xl" />
      <div className="container-site relative z-[2] grid gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <Reveal>
            <Flourish tone="mostaza" />
            <p className="mt-4 eyebrow text-mostaza-400">Featured dishes</p>
            <h2 id="featured-title" className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1] text-cream-50">
              The plates people <em className="italic text-mostaza-300">keep talking about.</em>
            </h2>
          </Reveal>
          {image && (
            <Reveal delay={0.1} className="mt-8">
              <ParallaxImage src={image.file} alt={image.alt} sizes="(min-width: 1024px) 50vw, 100vw" speed={0.12} className="aspect-[4/5] rounded-[28px] shadow-lift sm:aspect-[5/4]" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }}>
                {image.caption && <figcaption className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-brown-950/80 to-transparent px-5 pb-4 pt-12 text-[13px] text-cream-100">{image.caption}</figcaption>}
              </ParallaxImage>
            </Reveal>
          )}
        </div>
        <div className="min-w-0 lg:col-span-6 lg:pt-6">
          <RevealGroup as="ol" className="divide-y divide-cream-50/10" stagger={0.08}>
            {items.map((item, i) => (
              <RevealItem as="li" key={item.id}>
                <Link href={`/menu?item=${item.slug}`} className="group flex items-baseline gap-5 py-5 transition-colors hover:text-mostaza-200">
                  <span className="w-8 shrink-0 font-display text-[13px] font-semibold tracking-[0.2em] text-mostaza-400">0{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[1.7rem] leading-[1.1] text-cream-50 transition-colors group-hover:text-mostaza-200 sm:text-[2rem]">{item.name}</span>
                      {item.englishName && <span className="text-[14px] text-cream-100/60">{item.englishName}</span>}
                    </span>
                    {(item.description || item.englishDescription) && <span className="mt-1 block text-[15px] leading-relaxed text-cream-100/70">{item.description ?? item.englishDescription}</span>}
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <Pill tone="outline" className="text-cream-100/70">{item.categoryName}</Pill>
                      {item.popular && <Pill tone="mostaza" className="bg-mostaza-500/20 text-mostaza-300 ring-mostaza-500/40">Popular</Pill>}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-[1.4rem] tabular-nums text-cream-50">{item.price != null ? money(item.price) : item.priceNote}</span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.1} className="mt-8">
            <ButtonLink href="/menu" variant="light" arrow>
              View the menu
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
