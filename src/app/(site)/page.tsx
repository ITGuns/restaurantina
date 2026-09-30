import type { Metadata } from "next";
import { Bento } from "@/components/home/Bento";
import { BookingCta } from "@/components/home/BookingCta";
import { Breakfast } from "@/components/home/Breakfast";
import { Cinematic } from "@/components/home/Cinematic";
import { FeaturedDishes } from "@/components/home/FeaturedDishes";
import { FoodCarousel } from "@/components/home/FoodCarousel";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { Reviews } from "@/components/home/Reviews";
import { Sabores } from "@/components/home/Sabores";
import { Scratch } from "@/components/home/Scratch";
import { Social } from "@/components/home/Social";
import { Story } from "@/components/home/Story";
import { Sweets } from "@/components/home/Sweets";
import { Ticker } from "@/components/home/Ticker";
import { Visit } from "@/components/home/Visit";
import { flattenItems, getMenuTree } from "@/lib/data/menu";
import { getMedia } from "@/lib/data/media";
import { getBookingSettings, getRestaurant } from "@/lib/data/restaurant";
import { mediaForFile, toLite, toMediaLite } from "@/lib/menu-types";
import { pageMeta } from "@/lib/seo";
import { getSiteChrome } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const r = await getRestaurant();
  return pageMeta(r, { title: r.seoTitle ?? `${r.name} — ${r.tagline} · ${r.city}, ${r.state}`, description: r.seoDescription ?? r.description, path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const [{ restaurant, hours, status, phone, phoneHref, clock }, tree, media, settings] = await Promise.all([getSiteChrome(), getMenuTree(), getMedia(), getBookingSettings()]);

  const items = flattenItems(tree);
  const category = (slug: string) => tree.categories.find((c) => c.slug === slug);
  const featured = items.filter((i) => i.featured).slice(0, 6).map((i) => toLite(i));
  const popular = items.filter((i) => i.popular).map((i) => toLite(i));
  const desayunos = category("desayunos");
  const breakfast = (desayunos?.items ?? []).slice(0, 8).map((i) => toLite(i));
  const desserts = (category("postres")?.items ?? []).map((i) => toLite(i));
  const hotDrinks = (category("bebidas")?.items ?? []).filter((i) => /caf[eé] de la olla|chocolate/i.test(i.name)).slice(0, 2).map((i) => toLite(i));

  const photos = media.filter((m) => m.tag !== "brand");
  const gallery = photos.filter((m) => m.inGallery).map(toMediaLite);
  const heroImage = mediaForFile(media, restaurant.heroImage, restaurant.heroImageAlt ?? restaurant.name);
  const others = gallery.filter((m) => m.file !== heroImage?.file);
  const accent = others[others.length - 1] ?? null;
  const featuredImage = others[0] ?? gallery[0] ?? null;
  const cinematicImage = others[1] ?? others[0] ?? gallery[0] ?? null;
  const scratchImage = others[0] ?? gallery[0] ?? null;

  const tickerItems = [...restaurant.slogans, "Caldos", "Chilaquiles", "Menudo", "Pozole", "Albóndigas", "Chiles rellenos", "Fresh tortillas", "Café de la olla", "Pan dulce"].filter(Boolean);
  const socials = [
    { key: "instagram" as const, label: "Instagram", href: restaurant.instagramUrl, handle: restaurant.instagramHandle },
    { key: "facebook" as const, label: "Facebook", href: restaurant.facebookUrl, handle: restaurant.facebookName },
    { key: "tiktok" as const, label: "TikTok", href: restaurant.tiktokUrl, handle: restaurant.tiktokHandle },
  ];

  return (
    <>
      <Hero
        name={restaurant.name}
        logo={restaurant.logo}
        eyebrow={restaurant.heroEyebrow ?? `${restaurant.city}, ${restaurant.state}`}
        headline={restaurant.heroHeadline ?? restaurant.tagline}
        subheadline={restaurant.heroSubheadline}
        image={heroImage}
        accentImage={accent}
        status={status}
        addressShort={`${restaurant.addressLine1} · ${restaurant.city}, ${restaurant.state}`}
      />
      <Ticker items={tickerItems} />
      <Intro description={restaurant.description} rating={restaurant.rating} reviewCount={restaurant.reviewCount} priceRange={restaurant.priceRange} category={restaurant.category} googleUrl={restaurant.googleMapsUrl} />
      <FeaturedDishes items={featured} image={featuredImage} />
      <Sabores items={popular.length ? popular : featured} />
      <FoodCarousel images={gallery} />
      <Cinematic image={cinematicImage} lines={["Everything from scratch.", "Even the tortillas."]} caption={cinematicImage?.caption ?? null} />
      <Bento images={gallery} notes={restaurant.menuNotes} slogans={restaurant.slogans} />
      <Story name={restaurant.name} logo={restaurant.logo} heading={restaurant.storyHeading} story={restaurant.story} />
      {desayunos && <Breakfast items={breakfast} note={desayunos.note} englishNote={desayunos.englishNote} categorySlug={desayunos.slug} />}
      <Scratch image={scratchImage} />
      <Sweets desserts={desserts} drinks={hotDrinks} />
      <Reviews rating={restaurant.rating} reviewCount={restaurant.reviewCount} themes={restaurant.reviewThemes} googleUrl={restaurant.googleMapsUrl} />
      <Visit restaurant={restaurant} hours={hours} phone={phone} phoneHref={phoneHref} todayDow={clock.dayOfWeek} status={status} />
      <BookingCta phone={phone} phoneHref={phoneHref} largeParty={settings.largePartyThreshold} />
      <Social socials={socials} images={gallery} slogan={restaurant.slogans[0] ?? null} />
    </>
  );
}
