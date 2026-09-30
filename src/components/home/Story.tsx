import { Logo } from "@/components/site/Logo";
import { Flourish, TalaveraRing } from "@/components/site/Talavera";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/**
 * "Our story". The source has no verified history for Tina, so until the owner
 * writes one (Admin → Settings → Story) this shows only the verified concept.
 */
export function Story({ name, logo, heading, story }: { name: string; logo: string | null; heading: string | null; story: string | null }) {
  const paragraphs = (story ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <section aria-labelledby="story-title" className="relative overflow-hidden bg-cream-50 py-20 lg:py-28">
      <div aria-hidden className="pointer-events-none absolute -right-32 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(217_162_27/0.18),transparent)] blur-3xl" />
      <div className="container-site grid items-center gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5" amount={0.2}>
          <div className="relative mx-auto aspect-square w-[min(72vw,420px)]">
            <TalaveraRing className="absolute inset-0 h-full w-full" />
            <div className="arch absolute inset-[9%] flex items-center justify-center overflow-hidden bg-cream-100 shadow-card">
              <Logo src={logo} name={name} size={320} className="h-[86%] w-[86%]" />
            </div>
          </div>
        </Reveal>
        <div className="lg:col-span-7">
          <Reveal>
            <Flourish />
            <p className="mt-4 eyebrow text-clay-600">Nuestra historia</p>
            <h2 id="story-title" className="mt-4 font-display text-[clamp(2.3rem,4.8vw,4.2rem)] leading-[1.02] text-brown-900">
              {heading ?? (
                <>
                  The abuela on the sign is <em className="italic text-clay-600">Tina.</em>
                </>
              )}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-6 space-y-4 text-[16.5px] leading-relaxed text-brown-700">
            {paragraphs.length ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <>
                <p>
                  {name} is built around Tina, the abuela at the heart of the brand, and the kitchen cooks the way home kitchens do: caldos, chilaquiles, menudo, pozole, albóndigas and chiles rellenos made from scratch, with fresh tortillas alongside.
                </p>
                <p>Café de la olla is on the stove, pan dulce and desserts are on the table, and everything is served on Talavera-style clay plates.</p>
              </>
            )}
          </Reveal>
          <Reveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/menu" variant="secondary" arrow>
              See the menu
            </ButtonLink>
            <ButtonLink href="/visit" variant="outline" className="text-brown-900">
              Come visit
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
