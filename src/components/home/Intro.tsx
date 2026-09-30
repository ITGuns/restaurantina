import { Flourish } from "@/components/site/Talavera";
import { Pill } from "@/components/ui/Badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

const PILLARS = [
  { title: "Made from scratch", body: "Caldos, chilaquiles, albóndigas and chiles rellenos cooked the home-style way, with fresh tortillas.", accent: "text-clay-600" },
  { title: "Talavera-style plates", body: "Everything arrives on Talavera-style clay plates: color on the table before the first bite.", accent: "text-azul-500" },
  { title: "Café de la olla & pan dulce", body: "Menudo and pozole for the table, café de la olla and pan dulce to finish.", accent: "text-verde-500" },
];

export function Intro({ description, rating, reviewCount, priceRange, category, googleUrl }: { description: string; rating: string | null; reviewCount: number | null; priceRange: string | null; category: string; googleUrl: string | null }) {
  return (
    <section aria-labelledby="intro-title" className="relative overflow-hidden bg-cream-50 py-20 lg:py-28">
      <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <Reveal>
            <Flourish />
            <p className="mt-4 eyebrow text-clay-600">Comida casera · El Paso, Texas</p>
            <h2 id="intro-title" className="mt-4 font-display text-[clamp(2.3rem,4.8vw,4rem)] leading-[1.02] text-brown-900">
              Home-style Mexican comfort food, <em className="italic text-clay-600">made from scratch.</em>
            </h2>
            <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-brown-700">{description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {rating && reviewCount ? (
                googleUrl ? (
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                    <Pill tone="mostaza">★ {rating} · {reviewCount} Google reviews</Pill>
                  </a>
                ) : (
                  <Pill tone="mostaza">★ {rating} · {reviewCount} Google reviews</Pill>
                )
              ) : null}
              {priceRange && <Pill>{priceRange}</Pill>}
              <Pill tone="verde">{category}</Pill>
            </div>
          </Reveal>
        </div>
        <RevealGroup as="ul" className="grid gap-4 sm:grid-cols-3 lg:col-span-6 lg:grid-cols-1" stagger={0.1}>
          {PILLARS.map((p, i) => (
            <RevealItem as="li" key={p.title} className="group relative rounded-[22px] border border-brown-900/8 bg-cream-100 p-6 shadow-[0_1px_2px_rgb(61_43_31/0.04)] transition-all duration-500 ease-out-expo hover:-translate-y-0.5 hover:shadow-card">
              <span className={`font-display text-[13px] font-semibold uppercase tracking-[0.2em] ${p.accent}`}>0{i + 1}</span>
              <h3 className="mt-2 font-display text-2xl text-brown-900">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-brown-700">{p.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
