import { Marquee } from "@/components/motion/Marquee";

export function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="border-y border-brown-900/10 bg-brown-900 py-3 text-cream-100" aria-hidden>
      <Marquee speed={38}>
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-6 pr-6 font-display text-[19px] italic tracking-[0.01em] text-cream-100/90">
            {item}
            <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-mostaza-400"><path d="M8 1l7 7-7 7-7-7z" fill="currentColor" /></svg>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
