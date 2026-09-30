import type { Hours, RestaurantInfo } from "@/db/schema";
import { HoursTable } from "@/components/site/HoursTable";
import { Flourish } from "@/components/site/Talavera";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { directionsUrl, fullAddress, mapsEmbedUrl, mapsUrl } from "@/lib/site";
import { cn } from "@/lib/cn";

export function Visit({ restaurant: r, hours, phone, phoneHref, todayDow, status, compact = false }: { restaurant: RestaurantInfo; hours: Hours[]; phone: string; phoneHref: string; todayDow: number; status?: { isOpen: boolean; label: string; detail: string }; compact?: boolean }) {
  return (
    <section id="visit" aria-labelledby="visit-title" className={cn("relative scroll-mt-20 overflow-hidden bg-cream-50", compact ? "py-16 lg:py-24" : "py-20 lg:py-28")}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera opacity-[0.1] [mask-image:linear-gradient(to_right,black,transparent_60%)]" />
      <div className="container-site relative z-[2] grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <Flourish />
            <p className="mt-4 eyebrow text-clay-600">Find us</p>
            <h2 id="visit-title" className="mt-4 font-display text-[clamp(2.4rem,5.2vw,4.4rem)] leading-[0.98] text-brown-900">
              Come visit <em className="italic text-clay-600">Tina.</em>
            </h2>
            {status && (
              <p className="mt-4 flex items-center gap-2 text-[15px] text-brown-700">
                <span className={cn("inline-block h-2.5 w-2.5 rounded-full", status.isOpen ? "bg-verde-500" : "bg-clay-500")} />
                <span className="font-semibold text-brown-900">{status.label}</span>
                {status.detail && <span>· {status.detail}</span>}
              </p>
            )}
          </Reveal>
          <Reveal delay={0.1} className="mt-8 space-y-6">
            <div>
              <p className="eyebrow text-brown-500">Address</p>
              <a href={mapsUrl(r)} target="_blank" rel="noopener noreferrer" className="mt-1 block font-display text-2xl leading-tight text-brown-900 hover:text-clay-600">
                {r.addressLine1}
                {r.addressLine2 && (
                  <>
                    <br />
                    {r.addressLine2}
                  </>
                )}
                <br />
                {r.city}, {r.state} {r.zip}
              </a>
            </div>
            <div>
              <p className="eyebrow text-brown-500">Phone</p>
              <a href={phoneHref} className="mt-1 block text-lg font-semibold text-brown-900 hover:text-clay-600">
                {phone}
              </a>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href={directionsUrl(r)} variant="secondary" arrow>
                Get Directions
              </ButtonLink>
              <ButtonLink href={phoneHref} variant="outline" className="text-brown-900">
                Call Us
              </ButtonLink>
              <ButtonLink href="/book">Reserve a Table</ButtonLink>
            </div>
          </Reveal>
          {!compact && (
            <Reveal delay={0.15} className="mt-10 border-t border-brown-900/10 pt-6">
              <p className="eyebrow text-brown-500">Hours</p>
              <HoursTable hours={hours} todayDow={todayDow} tone="light" className="mt-2" />
              {r.hoursNote && <p className="mt-3 text-[13px] text-brown-500">{r.hoursNote}</p>}
            </Reveal>
          )}
        </div>
        <Reveal delay={0.1} className="lg:col-span-7" amount={0.2}>
          <div className="relative h-[360px] overflow-hidden rounded-[28px] border-[6px] border-cream-50 bg-cream-200 shadow-lift sm:h-[460px] lg:h-full lg:min-h-[560px]">
            <iframe title={`Map showing ${r.name} at ${fullAddress(r)}`} src={mapsEmbedUrl(r)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0 sepia-[0.35] saturate-[0.85] contrast-[1.05]" allowFullScreen />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-brown-900/10" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
