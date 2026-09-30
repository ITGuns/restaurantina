"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import type { AvailabilityInfo } from "@/lib/availability";
import type { ItemNode } from "@/lib/data/menu";
import { DietaryBadge, Pill } from "@/components/ui/Badge";
import { DIETARY_LABELS } from "@/lib/constants";
import { priceAdjustment } from "@/lib/format";
import { initialOf } from "./MenuItemCard";
import { PriceTag } from "./PriceTag";

/** Item detail drawer: photo (or a typographic Talavera state), Spanish + English names, descriptions, price, options. */
export function MenuItemModal({ item, availability, onClose }: { item: ItemNode | null; availability: AvailabilityInfo | undefined; onClose: () => void }) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (!item) return;
    lastFocused.current = document.activeElement;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
      (lastFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div key="backdrop" className="fixed inset-0 z-[70] flex items-end justify-center bg-brown-950/70 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose}>
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-cream-50 text-brown-900 shadow-lift sm:rounded-[28px]"
          >
            <button type="button" onClick={onClose} aria-label="Close" data-autofocus className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brown-950/60 text-cream-50 backdrop-blur transition hover:bg-brown-950">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
            <div className="overflow-y-auto">
              {item.image ? (
                <div className="relative aspect-[16/10] w-full bg-cream-200">
                  <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="(min-width: 640px) 672px, 100vw" className="object-cover" priority />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-950/40 to-transparent" />
                </div>
              ) : (
                <div className="relative flex h-36 items-end overflow-hidden bg-brown-900 px-6 pb-4 text-cream-50 sm:h-40 sm:px-8">
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.14]" />
                  <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-clay-500/30 blur-3xl" />
                  <span className="relative z-[2] font-display text-6xl italic leading-none text-mostaza-300 sm:text-7xl" aria-hidden>
                    {initialOf(item.name)}
                  </span>
                </div>
              )}
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap gap-1.5">
                  <Pill>{item.categoryName}</Pill>
                  {item.popular && <Pill tone="mostaza">Popular</Pill>}
                  {item.featured && <Pill tone="clay">Featured</Pill>}
                  {availability?.label && <Pill tone={availability.availableToday ? "azul" : "clay"}>{availability.label}</Pill>}
                  {availability?.availableNow && <Pill tone="verde">Available now</Pill>}
                </div>
                <div className="mt-4 flex items-start justify-between gap-6">
                  <div>
                    <h2 id="item-modal-title" className="font-display text-3xl leading-[1.1] text-brown-900 sm:text-4xl">
                      {item.name}
                    </h2>
                    {item.spanishName && <p className="mt-1 text-[16px] text-brown-700">{item.spanishName}</p>}
                    {item.englishName && <p className="mt-1 text-[15px] text-brown-500">{item.englishName}</p>}
                  </div>
                  <PriceTag item={item} size="lg" className="shrink-0 text-brown-900" />
                </div>
                {item.description && <p className="mt-4 text-[16px] leading-relaxed text-brown-700">{item.description}</p>}
                {item.englishDescription && <p className="mt-2 text-[15px] leading-relaxed text-brown-500">{item.englishDescription}</p>}
                {item.notes && <p className="mt-3 text-[14px] leading-relaxed text-brown-500">{item.notes}</p>}
                {availability?.detail && <p className="mt-3 text-[14px] text-brown-500">{availability.detail}</p>}

                {item.dietaryTags.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Dietary information">
                    {item.dietaryTags.map((t) => (
                      <li key={t} className="flex items-center gap-2 text-[14px] text-brown-700">
                        <DietaryBadge tag={t} /> {DIETARY_LABELS[t].description}
                      </li>
                    ))}
                  </ul>
                )}

                {item.modifierGroups.length > 0 && (
                  <div className="mt-8 space-y-6">
                    {item.modifierGroups.map((g) => (
                      <section key={g.id} aria-labelledby={`group-${g.id}`}>
                        <div className="flex items-baseline justify-between gap-4 border-b border-brown-900/10 pb-2">
                          <h3 id={`group-${g.id}`} className="font-display text-xl text-brown-900">
                            {g.name}
                          </h3>
                          <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-brown-500">
                            {g.required ? "Required" : "Optional"}
                            {g.maxSelections > 1 ? ` · up to ${g.maxSelections}` : g.required ? " · choose 1" : ""}
                          </span>
                        </div>
                        {g.description && <p className="mt-2 text-[13.5px] text-brown-500">{g.description}</p>}
                        <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                          {g.modifiers.map((m) => (
                            <li key={m.id} className="flex items-baseline justify-between gap-3 border-b border-dotted border-brown-900/15 pb-1.5">
                              <span className="text-[15px] text-brown-800">
                                {m.name}
                                {m.description && <span className="text-brown-500">: {m.description}</span>}
                              </span>
                              <span className="shrink-0 font-display text-[15px] text-brown-700">{priceAdjustment(m.priceAdjustment)}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
