"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Flourish } from "@/components/site/Talavera";
import { ButtonLink } from "@/components/ui/Button";
import { money } from "@/lib/format";
import type { MenuItemLite } from "@/lib/menu-types";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;
const TONES = ["#b5451b", "#1f3a93", "#2e5e4e", "#d9a21b", "#963a17", "#5a70cc"];
/** Round so server and client render byte-identical SVG attributes (avoids hydration drift). */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A Talavera plate that rotates a notch every time the selected dish changes. */
function Plate({ turn, tone }: { turn: number; tone: string }) {
  const petals = Array.from({ length: 16 });
  return (
    <motion.svg viewBox="0 0 400 400" aria-hidden animate={{ rotate: turn * 22.5 }} transition={{ type: "spring", stiffness: 50, damping: 14 }} className="absolute inset-0 h-full w-full drop-shadow-[0_30px_40px_rgb(30_20_13/0.35)]">
      <circle cx="200" cy="200" r="198" fill={tone} />
      <circle cx="200" cy="200" r="186" fill="#fcfaf5" />
      <circle cx="200" cy="200" r="178" fill="none" stroke="#1f3a93" strokeWidth="2" strokeDasharray="10 6" />
      {petals.map((_, i) => {
        const a = (i * Math.PI) / 8;
        const x = r2(200 + 158 * Math.cos(a));
        const y = r2(200 + 158 * Math.sin(a));
        return <ellipse key={i} cx={x} cy={y} rx="7" ry="13" transform={`rotate(${(i * 180) / 8 + 90} ${x} ${y})`} fill={i % 2 ? "#2e5e4e" : "#1f3a93"} opacity="0.9" />;
      })}
      {petals.map((_, i) => {
        const a = (i * Math.PI) / 8 + Math.PI / 16;
        return <circle key={`d${i}`} cx={r2(200 + 158 * Math.cos(a))} cy={r2(200 + 158 * Math.sin(a))} r="3" fill="#d9a21b" />;
      })}
      <circle cx="200" cy="200" r="134" fill="none" stroke={tone} strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
      <circle cx="200" cy="200" r="124" fill="#f5efe6" />
    </motion.svg>
  );
}

export function Sabores({ items, heading = "Sabores de Tina" }: { items: MenuItemLite[]; heading?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const [paused, setPaused] = useState(false);
  const item = items[index];

  const select = (i: number) => {
    if (i === index) return;
    setIndex(i);
    setTurn((t) => t + 1);
  };

  useEffect(() => {
    if (reduce || paused || items.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
      setTurn((t) => t + 1);
    }, 5200);
    return () => window.clearInterval(id);
  }, [reduce, paused, items.length]);

  if (!items.length || !item) return null;
  const tone = TONES[index % TONES.length];

  return (
    <section aria-labelledby="sabores-title" className="relative overflow-hidden bg-cream-100 py-20 lg:py-28" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera opacity-[0.16] [mask-image:radial-gradient(60%_60%_at_30%_50%,black,transparent)]" />
      <div className="container-site relative z-[2]">
        <div className="max-w-2xl">
          <Flourish />
          <p className="mt-4 eyebrow text-clay-600">Signature dishes</p>
          <h2 id="sabores-title" className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1] text-brown-900">
            {heading}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-brown-700">The dishes guests mention most. Pick one and the plate turns.</p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-6">
            <div className="relative mx-auto aspect-square w-[min(82vw,520px)]">
              <Plate turn={turn} tone={tone} />
              <div className="absolute inset-[31%] flex items-center justify-center overflow-hidden rounded-full text-center">
                <AnimatePresence mode="wait">
                  {item.image ? (
                    <motion.div key={item.id} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }} className="absolute inset-0">
                      <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="320px" className="object-cover" />
                    </motion.div>
                  ) : (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 18, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.55, ease }} className="px-4">
                      <p className="font-display text-[clamp(1.6rem,4.6vw,2.6rem)] font-semibold italic leading-[1.02]" style={{ color: tone }}>
                        {item.name}
                      </p>
                      <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.2em] text-brown-500">{item.categoryName}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                <motion.span key={`${item.id}-price`} initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease }} className="absolute -right-2 top-[8%] rounded-full bg-brown-900 px-4 py-2 font-display text-lg tabular-nums text-cream-50 shadow-lift sm:right-0">
                  {item.price != null ? money(item.price) : item.priceNote}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-6">
            <ul className="flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:gap-0 lg:overflow-visible lg:divide-y lg:divide-brown-900/10" aria-label="Signature dishes">
              {items.map((it, i) => {
                const active = i === index;
                return (
                  <li key={it.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => select(i)}
                      aria-pressed={active}
                      className={cn(
                        "group flex w-full items-baseline gap-4 rounded-full px-4 py-2.5 text-left transition-colors lg:rounded-none lg:px-0 lg:py-4",
                        active ? "bg-brown-900 text-cream-50 lg:bg-transparent lg:text-brown-900" : "bg-cream-50 text-brown-700 hover:text-brown-900 lg:bg-transparent",
                      )}
                    >
                      <span className={cn("hidden w-6 font-display text-[12px] font-semibold tracking-[0.2em] lg:block", active ? "text-clay-600" : "text-brown-400")}>0{i + 1}</span>
                      <span className={cn("font-display text-[1.1rem] leading-none transition-all lg:text-[1.9rem]", active && "lg:italic")}>{it.name}</span>
                      <span className={cn("hidden text-[13px] lg:inline", active ? "text-brown-600" : "text-brown-400")}>{it.categoryName}</span>
                      <span aria-hidden className={cn("ml-auto hidden h-2 w-2 rounded-full transition-all lg:block", active ? "scale-100 bg-clay-500" : "scale-0 bg-brown-400")} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 min-h-[92px] rounded-[22px] border border-brown-900/10 bg-cream-50 p-5" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
                  <p className="font-display text-xl text-brown-900">{item.name}</p>
                  <p className="mt-1 text-[15px] text-brown-700">{item.description ?? item.englishDescription ?? item.categoryName}</p>
                  {item.englishDescription && item.description && <p className="mt-1 text-[13.5px] text-brown-500">{item.englishDescription}</p>}
                  <Link href={`/menu?item=${item.slug}`} className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-clay-600 hover:underline">
                    See on the menu <span aria-hidden>→</span>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-6">
              <ButtonLink href="/menu" variant="secondary" arrow>
                Full menu
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
