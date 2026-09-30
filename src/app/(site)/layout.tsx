import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileCta } from "@/components/site/MobileCta";
import { RestaurantJsonLd } from "@/components/site/JsonLd";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { getRestaurant } from "@/lib/data/restaurant";
import { time12 } from "@/lib/format";
import { getSiteChrome } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const r = await getRestaurant();
  const title = r.seoTitle ?? `${r.name} — ${r.tagline} · ${r.city}, ${r.state}`;
  const description = r.seoDescription ?? r.description;
  const images = r.ogImageUrl ? [{ url: r.ogImageUrl, alt: `${r.name} — ${r.tagline}` }] : undefined;
  return {
    title: { default: title, template: `%s | ${r.name}` },
    description,
    openGraph: { type: "website", siteName: r.name, locale: "en_US", title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { restaurant, hours, status, phone, phoneHref, clock } = await getSiteChrome();
  const today = status.today;
  const hoursToday = today && !today.isClosed && today.opensAt && today.closesAt ? `${time12(today.opensAt, { compact: true })} – ${time12(today.closesAt, { compact: true })}` : "Closed";
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-clay-600 focus:px-4 focus:py-2 focus:text-cream-50">
        Skip to content
      </a>
      <ScrollProgress />
      <Header
        name={restaurant.name}
        logo={restaurant.logo}
        status={{ isOpen: status.isOpen, label: status.label, detail: status.detail }}
        phone={phone}
        phoneHref={phoneHref}
        address={`${restaurant.addressLine1}, ${restaurant.city}, ${restaurant.state}`}
        hoursToday={hoursToday}
        orderingUrl={restaurant.orderingEnabled ? restaurant.orderingUrl : null}
      />
      <main id="main">{children}</main>
      <Footer restaurant={restaurant} hours={hours} phone={phone} phoneHref={phoneHref} todayDow={clock.dayOfWeek} />
      <MobileCta phoneHref={phoneHref} />
      <RestaurantJsonLd restaurant={restaurant} hours={hours} phone={phone} />
    </>
  );
}
