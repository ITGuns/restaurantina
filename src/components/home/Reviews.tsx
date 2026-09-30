import { Flourish } from "@/components/site/Talavera";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

const TONES = ["bg-cream-50 text-brown-900", "bg-verde-500 text-cream-50", "bg-cream-50 text-brown-900", "bg-azul-500 text-cream-50", "bg-cream-50 text-brown-900", "bg-clay-600 text-cream-50", "bg-mostaza-500 text-brown-950"];

/** Social proof built from review *themes*: no fabricated quotations. */
export function Reviews({ rating, reviewCount, themes, googleUrl }: { rating: string | null; reviewCount: number | null; themes: string[]; googleUrl: string | null }) {
  if (!rating && !themes.length) return null;
  const stars = rating ? Math.round(Number(rating)) : 0;
  return (
    <section aria-labelledby="reviews-title" className="relative overflow-hidden bg-cream-200/70 py-20 lg:py-28">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <Flourish />
            <p className="mt-4 eyebrow text-clay-600">Lo que dicen</p>
            <h2 id="reviews-title" className="mt-4 font-display text-[clamp(2.3rem,4.6vw,3.8rem)] leading-[1] text-brown-900">
              What guests <em className="italic text-clay-600">keep mentioning.</em>
            </h2>
            {rating && (
              <div className="mt-8 rounded-[26px] bg-brown-900 p-6 text-cream-50 shadow-lift">
                <div className="flex items-end gap-3">
                  <span className="font-display text-[4.5rem] leading-none">{rating}</span>
                  <span className="mb-2 flex flex-col">
                    <span className="flex text-mostaza-400" role="img" aria-label={`${rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} viewBox="0 0 20 20" className={cn("h-5 w-5", i < stars ? "fill-current" : "fill-current opacity-25")} aria-hidden>
                          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8z" />
                        </svg>
                      ))}
                    </span>
                    {reviewCount && <span className="mt-1 text-[13px] text-cream-100/70">{reviewCount} Google reviews</span>}
                  </span>
                </div>
                {googleUrl && (
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-mostaza-300 hover:text-mostaza-200">
                    Read reviews on Google <span aria-hidden>↗</span>
                  </a>
                )}
              </div>
            )}
          </Reveal>
        </div>
        <RevealGroup as="ul" className="grid gap-3 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3" stagger={0.07}>
          {themes.map((t, i) => (
            <RevealItem as="li" key={t} className={cn("flex min-h-[150px] flex-col justify-between rounded-[22px] p-5 shadow-[0_1px_2px_rgb(61_43_31/0.05)]", TONES[i % TONES.length])}>
              <span aria-hidden className="font-display text-3xl italic opacity-50">“</span>
              <span className="font-display text-[1.25rem] leading-[1.2]">{t}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
