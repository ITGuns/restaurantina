import Link from "next/link";
import { Flourish } from "@/components/site/Talavera";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { money } from "@/lib/format";
import type { MenuItemLite } from "@/lib/menu-types";
import { cn } from "@/lib/cn";

const TONES = ["bg-clay-600 text-cream-50", "bg-azul-500 text-cream-50", "bg-verde-500 text-cream-50", "bg-brown-900 text-cream-50", "bg-mostaza-500 text-brown-950"];

/** Dessert + café showcase: typography-first cards for Postres and the hot drinks. */
export function Sweets({ desserts, drinks }: { desserts: MenuItemLite[]; drinks: MenuItemLite[] }) {
  if (!desserts.length && !drinks.length) return null;
  const cards = [...desserts, ...drinks];
  return (
    <section aria-labelledby="sweets-title" className="relative overflow-hidden bg-cream-100 py-20 lg:py-28">
      <div className="container-site">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Flourish />
            <p className="mt-4 eyebrow text-clay-600">Café y postres</p>
            <h2 id="sweets-title" className="mt-4 font-display text-[clamp(2.3rem,4.8vw,4.2rem)] leading-[1] text-brown-900">
              Something sweet, <em className="italic text-clay-600">something warm.</em>
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-brown-700">Mostachón, tres leches, café de la olla and chocolate caliente. Reviewers call the desserts amazing.</p>
          </div>
          <Link href="/menu?category=postres" className="group/btn inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-brown-800 hover:text-brown-950">
            Postres &amp; bebidas <span className="transition-transform group-hover/btn:translate-x-1">→</span>
          </Link>
        </Reveal>
        <RevealGroup as="ul" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {cards.map((item, i) => (
            <RevealItem as="li" key={item.id}>
              <Link href={`/menu?item=${item.slug}`} className={cn("group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[26px] p-6 shadow-card transition-transform duration-500 ease-out-expo hover:-translate-y-1", TONES[i % TONES.length])}>
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.12]" />
                <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 font-display text-[9rem] italic leading-none opacity-[0.12]">{item.name.replace(/^(El|La|Los|Las)\s+/i, "")[0]}</span>
                <span className="relative eyebrow opacity-80">{item.categoryName}</span>
                <span className="relative">
                  <span className="block font-display text-[1.9rem] italic leading-[1.05]">{item.name}</span>
                  {item.description && <span className="mt-2 block text-[14px] leading-relaxed opacity-85">{item.description}</span>}
                  <span className="mt-4 block font-display text-xl tabular-nums">{item.price != null ? money(item.price) : item.priceNote}</span>
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
