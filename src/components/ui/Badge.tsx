import type { DietaryTag } from "@/db/schema";
import { DIETARY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const dietaryLight: Record<DietaryTag, string> = {
  vegetarian: "bg-verde-500/12 text-verde-600 ring-verde-500/30",
  vegan: "bg-verde-500/18 text-verde-700 ring-verde-500/40",
  "gluten-free": "bg-mostaza-500/20 text-mostaza-700 ring-mostaza-500/40",
  spicy: "bg-clay-500/12 text-clay-700 ring-clay-500/30",
  "contains-nuts": "bg-brown-900/8 text-brown-700 ring-brown-900/15",
  "contains-dairy": "bg-brown-900/8 text-brown-700 ring-brown-900/15",
};
const dietaryDark: Record<DietaryTag, string> = {
  vegetarian: "bg-verde-400/20 text-verde-300 ring-verde-400/40",
  vegan: "bg-verde-400/25 text-verde-200 ring-verde-400/50",
  "gluten-free": "bg-mostaza-500/20 text-mostaza-300 ring-mostaza-500/40",
  spicy: "bg-clay-500/20 text-clay-300 ring-clay-500/40",
  "contains-nuts": "bg-cream-50/10 text-cream-200 ring-cream-50/20",
  "contains-dairy": "bg-cream-50/10 text-cream-200 ring-cream-50/20",
};

export function DietaryBadge({ tag, size = "sm", tone = "light", className }: { tag: DietaryTag; size?: "xs" | "sm"; tone?: "dark" | "light"; className?: string }) {
  const meta = DIETARY_LABELS[tag];
  return (
    <span title={meta.description} aria-label={meta.description} className={cn("inline-flex items-center rounded-full font-bold uppercase tracking-[0.12em] ring-1 ring-inset", size === "xs" ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]", tone === "dark" ? dietaryDark[tag] : dietaryLight[tag], className)}>
      {meta.short}
    </span>
  );
}

export function Pill({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "clay" | "verde" | "azul" | "mostaza" | "dark" | "light" | "outline"; className?: string }) {
  const tones = {
    neutral: "bg-brown-900/6 text-brown-800 ring-brown-900/12",
    clay: "bg-clay-500/12 text-clay-700 ring-clay-500/30",
    verde: "bg-verde-500/12 text-verde-700 ring-verde-500/30",
    azul: "bg-azul-500/10 text-azul-600 ring-azul-500/25",
    mostaza: "bg-mostaza-500/18 text-mostaza-700 ring-mostaza-500/40",
    dark: "bg-brown-900 text-cream-100 ring-brown-800",
    light: "bg-cream-50/92 text-brown-900 ring-cream-300 backdrop-blur",
    outline: "bg-transparent text-current ring-current/30",
  };
  return <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-[0.14em] ring-1 ring-inset", tones[tone], className)}>{children}</span>;
}
