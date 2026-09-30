"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { AvailabilityInfo } from "@/lib/availability";
import type { ItemNode } from "@/lib/data/menu";
import { DietaryBadge, Pill } from "@/components/ui/Badge";
import { PriceTag } from "./PriceTag";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;
const TILES = ["bg-clay-600 text-cream-50", "bg-azul-500 text-cream-50", "bg-verde-500 text-cream-50", "bg-brown-900 text-cream-50", "bg-mostaza-500 text-brown-950"];

export const initialOf = (name: string) => name.replace(/^(El|La|Los|Las|Burrito|Chimichanga|Quesadilla)\s+/i, "")[0] ?? name[0];

/**
 * Editorial menu row: thumbnail (or typographic tile) · name (+ English name) · description · price.
 * Items without a photo never get an invented image.
 */
export function MenuItemCard({ item, index, availability, onOpen }: { item: ItemNode; index: number; availability: AvailabilityInfo | undefined; onOpen: (slug: string) => void }) {
  const reduce = useReducedMotion();
  const unavailableToday = availability && !availability.availableToday;
  const customizable = item.modifierGroups.length > 0;
  return (
    <motion.li layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease, delay: Math.min(index, 12) * 0.04 }}>
      <button
        type="button"
        onClick={() => onOpen(item.slug)}
        aria-haspopup="dialog"
        className={cn(
          "group grid w-full grid-cols-[64px_1fr] items-start gap-4 rounded-[22px] border border-brown-900/8 bg-cream-50 p-4 text-left shadow-[0_1px_2px_rgb(61_43_31/0.04)] transition-all duration-500 ease-out-expo",
          "hover:-translate-y-0.5 hover:border-clay-500/40 hover:bg-white hover:shadow-card focus-visible:outline-offset-4",
          "sm:grid-cols-[84px_1fr_auto] sm:items-center sm:gap-5 sm:p-5",
          unavailableToday && "opacity-75",
        )}
      >
        <span className={cn("relative block aspect-square w-16 overflow-hidden rounded-2xl sm:w-[84px]", item.image ? "bg-cream-200" : TILES[index % TILES.length])}>
          {item.image ? (
            <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="84px" className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.08]" />
          ) : (
            <span className="flex h-full w-full items-center justify-center" aria-hidden>
              <span className="font-display text-3xl italic leading-none sm:text-4xl">{initialOf(item.name)}</span>
            </span>
          )}
        </span>

        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-display text-[1.35rem] leading-[1.12] text-brown-900 transition-colors group-hover:text-clay-600 sm:text-[1.5rem]">{item.name}</span>
            {item.englishName && <span className="text-[14px] text-brown-500">{item.englishName}</span>}
          </span>
          {item.description && <span className="mt-1 block text-[14.5px] leading-relaxed text-brown-700">{item.description}</span>}
          {item.englishDescription && <span className="mt-0.5 block text-[13.5px] leading-relaxed text-brown-500">{item.englishDescription}</span>}
          {!item.description && !item.englishDescription && item.notes && <span className="mt-1 block text-[14px] text-brown-500">{item.notes}</span>}
          {(item.featured || item.popular || availability?.label || customizable || item.dietaryTags.length > 0) && (
            <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {item.popular && <Pill tone="mostaza">Popular</Pill>}
              {item.featured && !item.popular && <Pill tone="clay">Featured</Pill>}
              {availability?.label && <Pill tone={unavailableToday ? "clay" : "azul"}>{availability.label}</Pill>}
              {item.dietaryTags.map((t) => (
                <DietaryBadge key={t} tag={t} size="xs" />
              ))}
              {customizable && <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brown-500">Options</span>}
            </span>
          )}
          <span className="mt-3 flex items-center justify-between sm:hidden">
            <PriceTag item={item} size="md" className="text-brown-900" />
          </span>
        </span>

        <span className="hidden items-center gap-3 sm:flex">
          <PriceTag item={item} className="text-brown-900 transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
          <svg viewBox="0 0 20 20" className="h-4 w-4 -translate-x-2 text-clay-500 opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </span>
      </button>
    </motion.li>
  );
}
