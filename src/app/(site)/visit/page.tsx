import type { Metadata } from "next";
import { Visit } from "@/components/home/Visit";
import { Flourish } from "@/components/site/Talavera";
import { getRestaurant } from "@/lib/data/restaurant";
import { pageMeta } from "@/lib/seo";
import { fullAddress, getSiteChrome } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const r = await getRestaurant();
  return pageMeta(r, { title: "Visit Us", description: `${r.name} is at ${fullAddress(r)}. Hours, directions and phone.`, path: "/visit" });
}

export default async function VisitPage() {
  const { restaurant, hours, status, phone, phoneHref, clock } = await getSiteChrome();
  return (
    <>
      <section className="relative overflow-hidden bg-brown-950 pb-10 pt-32 text-cream-50 md:pt-40">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.07]" />
        <div className="container-site relative z-[2]">
          <Flourish tone="mostaza" />
          <p className="mt-4 eyebrow text-mostaza-400">Visit</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] leading-[0.95] tracking-[-0.01em]">
            Aquí te <em className="italic text-mostaza-300">esperamos.</em>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/70">{fullAddress(restaurant)}</p>
        </div>
      </section>
      <Visit restaurant={restaurant} hours={hours} phone={phone} phoneHref={phoneHref} todayDow={clock.dayOfWeek} status={status} />
    </>
  );
}
