import { TalaveraDivider } from "@/components/site/Talavera";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function BookingCta({ phone, phoneHref, largeParty }: { phone: string; phoneHref: string; largeParty: number }) {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-clay-600 text-cream-50">
      <TalaveraDivider tone="dark" className="opacity-50" />
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-mostaza-500/30 blur-3xl" />
      <div className="container-site relative z-[2] flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <Reveal>
          <p className="eyebrow text-cream-100/80">Reservations</p>
          <h2 id="cta-title" className="mt-3 font-display text-[clamp(2.2rem,4.8vw,4rem)] leading-[1] text-cream-50">
            Save your table. <em className="italic text-mostaza-200">Tina is waiting.</em>
          </h2>
          <p className="mt-3 max-w-lg text-[15.5px] text-cream-100/85">
            Pick a day, a party size and a time. Parties of {largeParty} or more are confirmed by our team, or call{" "}
            <a href={phoneHref} className="font-semibold text-cream-50 underline-offset-4 hover:underline">
              {phone}
            </a>
            .
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-wrap gap-3">
          <ButtonLink href="/book" variant="light" size="lg" arrow>
            Reserve a Table
          </ButtonLink>
          <ButtonLink href="/menu" variant="outline" size="lg" className="text-cream-50">
            Explore the Menu
          </ButtonLink>
        </Reveal>
      </div>
      <TalaveraDivider tone="dark" className="opacity-50" />
    </section>
  );
}
