import type { Metadata } from "next";
import { BookingSettingsForm } from "@/components/admin/settings/BookingSettingsForm";
import { ContactForm } from "@/components/admin/settings/ContactForm";
import { PasswordForm } from "@/components/admin/settings/PasswordForm";
import { HeroStoryForm, LegalForm, LinksForm, RestaurantForm, SeoForm } from "@/components/admin/settings/RestaurantForm";
import { PageHeader } from "@/components/admin/ui";
import { readMedia } from "@/lib/data/media";
import { readBookingSettings, readRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, info, media] = await Promise.all([readBookingSettings(), readRestaurant(), readMedia(true)]);
  const library = media.map((m) => ({ id: m.id, file: m.file, alt: m.alt, tag: m.tag }));
  return (
    <>
      <PageHeader title="Settings" description="Restaurant details, phone resolver, hero copy and story, social & ordering links, SEO, legal pages, booking rules and your account." />
      <div className="space-y-8">
        <ContactForm info={info} />
        <RestaurantForm info={info} library={library} />
        <HeroStoryForm info={info} library={library} />
        <LinksForm info={info} />
        <SeoForm info={info} library={library} />
        <BookingSettingsForm settings={settings} />
        <LegalForm info={info} />
        <PasswordForm />
      </div>
    </>
  );
}
