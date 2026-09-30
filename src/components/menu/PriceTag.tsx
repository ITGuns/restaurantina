import type { MenuItem } from "@/db/schema";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PriceTag({ item, className, size = "md", tone = "light" }: { item: Pick<MenuItem, "price" | "priceNote">; className?: string; size?: "sm" | "md" | "lg"; tone?: "light" | "dark" }) {
  const sz = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-[1.45rem]";
  const muted = tone === "light" ? "text-brown-500" : "text-cream-100/70";
  if (item.price == null) {
    if (!item.priceNote) return null;
    return <span className={cn("font-display", muted, sz, className)}>{item.priceNote}</span>;
  }
  return (
    <span className={cn("flex flex-col items-end leading-none", className)}>
      <span className={cn("font-display tabular-nums", sz)}>{money(item.price)}</span>
      {item.priceNote && <span className={cn("mt-1 text-[11px] font-bold uppercase tracking-[0.14em]", muted)}>{item.priceNote}</span>}
    </span>
  );
}
