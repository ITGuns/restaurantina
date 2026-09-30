import Link from "next/link";
import type { Hours, RestaurantInfo } from "@/db/schema";
import { Logo } from "./Logo";
import { HoursTable } from "./HoursTable";
import { TalaveraDivider } from "./Talavera";
import { SocialIcon } from "./SocialIcon";
import { mapsUrl } from "@/lib/site";

export function Footer({ restaurant: r, hours, phone, phoneHref, todayDow }: { restaurant: RestaurantInfo; hours: Hours[]; phone: string; phoneHref: string; todayDow: number }) {
  const year = new Date().getFullYear();
  const socials = [
    { key: "instagram", href: r.instagramUrl, label: "Instagram", handle: r.instagramHandle },
    { key: "facebook", href: r.facebookUrl, label: "Facebook", handle: r.facebookName },
    { key: "tiktok", href: r.tiktokUrl, label: "TikTok", handle: r.tiktokHandle },
  ].filter((s) => s.href);
  const links = [
    { href: "/menu", label: "Menu" },
    { href: "/book", label: "Reserve a Table" },
    { href: "/visit", label: "Visit Us" },
    { href: "/gallery", label: "Gallery" },
  ];
  return (
    <footer className="relative overflow-hidden bg-brown-950 pb-28 pt-0 text-cream-100 lg:pb-12">
      <TalaveraDivider tone="dark" className="opacity-60" />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-clay-600/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-azul-600/20 blur-3xl" />
      <div className="container-site relative z-[2] grid gap-12 pt-14 lg:grid-cols-12 lg:gap-8 lg:pt-20">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-4">
            <Logo src={r.logo} name={r.name} size={84} variant="badge" />
            <div>
              <p className="font-display text-3xl font-semibold text-cream-50">{r.name}</p>
              <p className="mt-1 eyebrow text-mostaza-400">{r.tagline}</p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-100/70">{r.description}</p>
          <address className="mt-6 not-italic text-[15px] leading-relaxed text-cream-100/85">
            <a href={mapsUrl(r)} target="_blank" rel="noopener noreferrer" className="hover:text-cream-50">
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
            <br />
            <a href={phoneHref} className="mt-2 inline-block font-semibold text-cream-50 hover:text-mostaza-300">
              {phone}
            </a>
            {r.email && (
              <>
                <br />
                <a href={`mailto:${r.email}`} className="hover:text-cream-50">
                  {r.email}
                </a>
              </>
            )}
          </address>
        </div>

        <div className="lg:col-span-2">
          <h2 className="eyebrow text-mostaza-400">Explore</h2>
          <ul className="mt-5 space-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  {l.label}
                </Link>
              </li>
            ))}
            {r.orderingEnabled && r.orderingUrl && (
              <li>
                <a href={r.orderingUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  Order Online ↗
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h2 className="eyebrow text-mostaza-400">Follow Tina</h2>
          <ul className="mt-5 space-y-3">
            {socials.map((s) => (
              <li key={s.key}>
                <a href={s.href!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  <SocialIcon name={s.key as "instagram" | "facebook" | "tiktok"} className="h-4 w-4" />
                  <span>{s.label}</span>
                  {s.handle && <span className="text-[12px] text-cream-100/50">{s.handle}</span>}
                </a>
              </li>
            ))}
            {socials.length === 0 && <li className="text-[14px] text-cream-100/50">Social links coming soon.</li>}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="eyebrow text-mostaza-400">Hours</h2>
          <HoursTable hours={hours} tone="dark" className="mt-4" todayDow={todayDow} />
          {r.hoursNote && <p className="mt-3 text-[12.5px] text-cream-100/60">{r.hoursNote}</p>}
          <Link href="/book" className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.16em] text-cream-50 hover:text-mostaza-300">
            Reserve a table <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <div className="container-site relative z-[2] mt-14 flex flex-col gap-3 border-t border-cream-50/10 pt-6 text-[13px] text-cream-100/60 sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {year} {r.name}. {r.city}, {r.state}.
        </span>
        <div className="flex flex-wrap gap-5">
          <Link href="/privacy" className="hover:text-cream-100">Privacy</Link>
          <Link href="/terms" className="hover:text-cream-100">Terms</Link>
          <Link href="/admin" className="hover:text-cream-100">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
