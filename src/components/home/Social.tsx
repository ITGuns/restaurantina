import Image from "next/image";
import { SocialIcon } from "@/components/site/SocialIcon";
import { Flourish } from "@/components/site/Talavera";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import type { MediaLite } from "@/lib/menu-types";
import { cn } from "@/lib/cn";

type Social = { key: "instagram" | "facebook" | "tiktok"; label: string; href: string | null; handle: string | null };

export function Social({ socials, images, slogan }: { socials: Social[]; images: MediaLite[]; slogan: string | null }) {
  const live = socials.filter((s) => s.href);
  if (!live.length) return null;
  const tones: Record<string, string> = { instagram: "bg-clay-600", facebook: "bg-azul-500", tiktok: "bg-brown-950" };
  return (
    <section aria-labelledby="social-title" className="relative overflow-hidden bg-cream-100 py-20 lg:py-28">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <Flourish />
          <p className="mt-4 eyebrow text-clay-600">Follow Tina</p>
          <h2 id="social-title" className="mt-4 font-display text-[clamp(2.3rem,4.8vw,4.2rem)] leading-[1] text-brown-900">
            {slogan ?? "Follow along."}
          </h2>
          <p className="mt-4 text-[16px] text-brown-700">New plates, specials and the occasional DJ night, posted first on social.</p>
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <RevealGroup as="ul" className="grid gap-3 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-1" stagger={0.08}>
            {live.map((s) => (
              <RevealItem as="li" key={s.key}>
                <a href={s.href!} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-[22px] border border-brown-900/8 bg-cream-50 p-4 shadow-[0_1px_2px_rgb(61_43_31/0.04)] transition-all duration-500 ease-out-expo hover:-translate-y-0.5 hover:shadow-card">
                  <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-cream-50", tones[s.key])}>
                    <SocialIcon name={s.key} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl text-brown-900">{s.label}</span>
                    {s.handle && <span className="block truncate text-[14px] text-brown-600">{s.handle}</span>}
                  </span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-clay-600 transition-transform group-hover:translate-x-1">Follow ↗</span>
                </a>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((img, i) => (
                <div key={`${img.id}-${i}`} className={cn("relative overflow-hidden rounded-2xl bg-cream-200", i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square")}>
                  <Image src={img.file} alt={img.alt} fill sizes="(min-width: 1024px) 200px, 33vw" className="object-cover" style={{ objectPosition: `${img.focalX}% ${img.focalY}%` }} />
                </div>
              ))}
            </div>
            {live[0] && (
              <div className="mt-5">
                <ButtonLink href={live[0].href!} variant="secondary" size="sm" arrow>
                  Follow us on {live[0].label}
                </ButtonLink>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
