import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import type { MediaLite } from "@/lib/menu-types";

/** Full-viewport photograph with overlapping editorial typography. */
export function Cinematic({ image, lines, caption }: { image: MediaLite | null; lines: string[]; caption: string | null }) {
  if (!image) return null;
  return (
    <section aria-label="Made from scratch" className="relative isolate min-h-[88svh] overflow-hidden bg-brown-950 text-cream-50">
      <ParallaxImage src={image.file} alt={image.alt} sizes="100vw" speed={0.22} reveal="none" className="absolute inset-0" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-950/90 via-brown-950/35 to-brown-950/20" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_80%,rgb(30_20_13/0.55),transparent)]" />
      <div className="container-site relative z-[2] flex min-h-[88svh] flex-col justify-end pb-16 pt-40 lg:pb-24">
        <SplitText as="h2" animate={false} lines={lines.map((text, i) => ({ text, className: i === lines.length - 1 ? "italic text-mostaza-300" : undefined }))} className="max-w-5xl font-display text-[clamp(2.6rem,7.6vw,7rem)] font-medium leading-[0.94] tracking-[-0.02em] text-shadow-soft" />
        {caption && (
          <Reveal delay={0.3} className="mt-6">
            <p className="max-w-lg text-[14px] uppercase tracking-[0.18em] text-cream-100/75">{caption}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
