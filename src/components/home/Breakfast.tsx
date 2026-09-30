import Link from "next/link";
import { Flourish } from "@/components/site/Talavera";
import { Pill } from "@/components/ui/Badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { money } from "@/lib/format";
import type { MenuItemLite } from "@/lib/menu-types";

/** Typography-first showcase for the breakfast menu (no invented photography). */
export function Breakfast({ items, note, englishNote, categorySlug }: { items: MenuItemLite[]; note: string | null; englishNote: string | null; categorySlug: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="breakfast-title" className="relative overflow-hidden bg-mostaza-200/60 py-20 lg:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera opacity-[0.12]" />
      <div className="container-site relative z-[2]">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Flourish />
            <p className="mt-4 eyebrow text-clay-600">Desayunos</p>
            <h2 id="breakfast-title" className="mt-4 font-display text-[clamp(2.3rem,4.8vw,4.2rem)] leading-[1] text-brown-900">
              Mexican breakfast, <em className="italic text-clay-600">served all morning.</em>
            </h2>
            {note && (
              <p className="mt-4 flex flex-wrap items-center gap-2 text-[15px] text-brown-700">
                <Pill tone="clay">{note}</Pill>
                {englishNote && <span className="text-brown-500">{englishNote}</span>}
              </p>
            )}
          </div>
          <Link href={`/menu?category=${categorySlug}`} className="group/btn inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-brown-800 hover:text-brown-950">
            All desayunos <span className="transition-transform group-hover/btn:translate-x-1">→</span>
          </Link>
        </Reveal>
        <RevealGroup as="ul" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
          {items.map((item) => (
            <RevealItem as="li" key={item.id}>
              <Link href={`/menu?item=${item.slug}`} className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-brown-900/8 bg-cream-50 p-5 shadow-[0_1px_2px_rgb(61_43_31/0.04)] transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-card">
                <span aria-hidden className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-mostaza-300/40 transition-transform duration-700 ease-out-expo group-hover:scale-[1.6]" />
                <span className="relative">
                  <span className="block font-display text-[1.45rem] leading-[1.1] text-brown-900 transition-colors group-hover:text-clay-600">{item.name}</span>
                  {item.description && <span className="mt-1.5 block text-[14px] leading-relaxed text-brown-700">{item.description}</span>}
                  {item.englishDescription && <span className="mt-1 block text-[13px] text-brown-500">{item.englishDescription}</span>}
                </span>
                <span className="relative mt-5 flex items-center justify-between">
                  <span className="font-display text-xl tabular-nums text-brown-900">{item.price != null ? money(item.price) : item.priceNote}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-clay-600 opacity-0 transition-opacity group-hover:opacity-100">Details →</span>
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
