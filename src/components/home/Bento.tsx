import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import type { MediaLite } from "@/lib/menu-types";
import { cn } from "@/lib/cn";

type TextTile = { eyebrow: string; text: string; tone: "azul" | "verde" | "mostaza" | "clay" | "brown" };
type Tile = { kind: "image"; image: MediaLite } | ({ kind: "text" } & TextTile);

const TONE: Record<string, string> = {
  azul: "bg-azul-500 text-cream-50",
  verde: "bg-verde-500 text-cream-50",
  mostaza: "bg-mostaza-500 text-brown-950",
  clay: "bg-clay-600 text-cream-50",
  brown: "bg-brown-900 text-cream-50",
};

/** Mixed-size editorial grid: the photography interleaved with typography tiles carrying menu notes and slogans. */
export function Bento({ images, notes, slogans }: { images: MediaLite[]; notes: string[]; slogans: string[] }) {
  if (!images.length) return null;
  const tiles: Tile[] = [];
  const texts: TextTile[] = [
    ...notes.slice(0, 2).map((text, i) => ({ eyebrow: "Del menú", text, tone: (["mostaza", "verde"] as const)[i % 2] })),
    ...slogans.slice(0, 2).map((text, i) => ({ eyebrow: "Tina dice", text, tone: (["azul", "clay"] as const)[i % 2] })),
  ];
  let ti = 0;
  images.forEach((image, i) => {
    tiles.push({ kind: "image", image });
    if ((i === 0 || i === 1) && texts[ti]) tiles.push({ kind: "text", ...texts[ti++] });
  });
  while (texts[ti] && tiles.length < 7) tiles.push({ kind: "text", ...texts[ti++] });
  const spans = ["md:col-span-2 md:row-span-2", "md:col-span-1", "md:col-span-1", "md:col-span-2", "md:col-span-1", "md:col-span-1", "md:col-span-2"];

  return (
    <section aria-labelledby="bento-title" className="relative overflow-hidden bg-cream-100 py-20 lg:py-28">
      <div className="container-site">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-clay-600">En la mesa</p>
            <h2 id="bento-title" className="mt-4 font-display text-[clamp(2.3rem,4.6vw,4rem)] leading-[1] text-brown-900">
              Color on the table, <em className="italic text-clay-600">before the first bite.</em>
            </h2>
          </div>
          <Link href="/gallery" className="group/btn inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-brown-800 hover:text-brown-950">
            Open the gallery <span className="transition-transform group-hover/btn:translate-x-1">→</span>
          </Link>
        </Reveal>
        <RevealGroup as="ul" className="mt-10 grid auto-rows-[200px] grid-cols-2 gap-3 md:auto-rows-[240px] md:grid-cols-4 md:gap-4" stagger={0.07}>
          {tiles.slice(0, 7).map((t, i) => (
            <RevealItem as="li" key={i} className={cn("col-span-1", i === 0 && "col-span-2 row-span-2", spans[i])}>
              {t.kind === "image" ? (
                <Link href={`/gallery?photo=${t.image.id}`} className="group relative block h-full w-full overflow-hidden rounded-[22px] bg-cream-200 shadow-card">
                  <Image src={t.image.file} alt={t.image.alt} fill sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.06]" style={{ objectPosition: `${t.image.focalX}% ${t.image.focalY}%` }} />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute inset-x-4 bottom-4 translate-y-2 text-[13px] font-medium leading-snug text-cream-50 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">{t.image.caption ?? t.image.alt}</span>
                </Link>
              ) : (
                <div className={cn("relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[22px] p-5", TONE[t.tone])}>
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.12]" />
                  <p className="relative eyebrow opacity-80">{t.eyebrow}</p>
                  <p className="relative font-display text-[clamp(1.2rem,2.2vw,1.7rem)] italic leading-[1.15]">{t.text}</p>
                </div>
              )}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
