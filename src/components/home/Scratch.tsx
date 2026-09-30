import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Flourish } from "@/components/site/Talavera";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import type { MediaLite } from "@/lib/menu-types";

const LINES = [
  { title: "Fresh tortillas", body: "Made in-house, the detail reviewers keep mentioning." },
  { title: "Traditional Mexican dishes", body: "Caldos, chilaquiles, menudo, pozole, albóndigas, chiles rellenos." },
  { title: "Home-style comfort food", body: "Cooked from scratch, plated with care." },
  { title: "Café de la olla", body: "Slow-brewed and served hot." },
  { title: "Pan dulce", body: "The sweet finish on the table." },
];

/** Visual storytelling around the scratch-made concept (every line is supported by the source). */
export function Scratch({ image }: { image: MediaLite | null }) {
  return (
    <section aria-labelledby="scratch-title" className="relative overflow-hidden bg-brown-900 py-20 text-cream-50 lg:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.07]" />
      <div className="container-site relative z-[2] grid items-center gap-12 lg:grid-cols-12">
        {image && (
          <Reveal className="lg:col-span-5" amount={0.2}>
            <ParallaxImage src={image.file} alt={image.alt} sizes="(min-width: 1024px) 42vw, 100vw" speed={0.16} reveal="left" className="arch aspect-[4/5] shadow-lift" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} />
          </Reveal>
        )}
        <div className="lg:col-span-7">
          <Reveal>
            <Flourish tone="mostaza" />
            <p className="mt-4 eyebrow text-mostaza-400">Hecho en casa</p>
            <h2 id="scratch-title" className="mt-4 font-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.96] text-cream-50">
              Made from <em className="italic text-mostaza-300">scratch.</em>
            </h2>
          </Reveal>
          <RevealGroup as="ol" className="mt-8 divide-y divide-cream-50/10 border-y border-cream-50/10" stagger={0.1}>
            {LINES.map((l, i) => (
              <RevealItem as="li" key={l.title} className="grid gap-1 py-5 sm:grid-cols-[56px_1fr] sm:items-baseline">
                <span className="font-display text-[13px] font-semibold tracking-[0.2em] text-mostaza-400">0{i + 1}</span>
                <span>
                  <span className="block font-display text-[1.7rem] leading-[1.1] text-cream-50 sm:text-[2.1rem]">{l.title}</span>
                  <span className="mt-1 block text-[15px] text-cream-100/65">{l.body}</span>
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
