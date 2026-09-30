"use client";

import type { Media, RestaurantInfo } from "@/db/schema";
import { ImageUpload } from "@/components/admin/menu/ImageUpload";
import { Btn, Card, Field, Input, Textarea } from "@/components/admin/ui";
import { lines, useSettingsForm } from "./useSettingsForm";

type Lib = Pick<Media, "id" | "file" | "alt" | "tag">[];

export function RestaurantForm({ info, library }: { info: RestaurantInfo; library: Lib }) {
  const { f, set, text, errors, busy, submit } = useSettingsForm(
    { name: info.name, tagline: info.tagline, category: info.category, description: info.description, logo: info.logo ?? "", rating: info.rating ?? "", reviewCount: info.reviewCount == null ? "" : String(info.reviewCount), priceRange: info.priceRange ?? "", reviewThemes: info.reviewThemes.join("\n"), slogans: info.slogans.join("\n"), menuNotes: info.menuNotes.join("\n") },
    "Restaurant info saved",
    (v) => ({ ...v, reviewThemes: lines(v.reviewThemes), slogans: lines(v.slogans), menuNotes: lines(v.menuNotes) }),
  );
  return (
    <form onSubmit={submit} id="restaurant">
      <Card title="Restaurant information" description="Name, tagline, description and the social-proof facts shown on the homepage." actions={<Btn type="submit" variant="primary" loading={busy}>Save info</Btn>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="s-name" error={errors.name} required><Input {...text("name")} required /></Field>
          <Field label="Tagline" htmlFor="s-tagline" error={errors.tagline} required><Input {...text("tagline")} required /></Field>
          <Field label="Category" htmlFor="s-category" error={errors.category}><Input {...text("category")} /></Field>
          <Field label="Price range" htmlFor="s-priceRange" error={errors.priceRange} hint="e.g. $10–20 per person"><Input {...text("priceRange")} /></Field>
          <Field label="Description" htmlFor="s-description" error={errors.description} className="sm:col-span-2"><Textarea {...text("description")} /></Field>
          <Field label="Logo" className="sm:col-span-2"><ImageUpload value={f.logo} onChange={(v) => set("logo", v)} library={library} altSuggestion={`${f.name} logo`} /></Field>
          <Field label="Google rating" htmlFor="s-rating" error={errors.rating} hint="0–5, e.g. 4.7"><Input {...text("rating")} inputMode="decimal" /></Field>
          <Field label="Review count" htmlFor="s-reviewCount" error={errors.reviewCount}><Input {...text("reviewCount")} inputMode="numeric" /></Field>
          <Field label="Review themes (one per line)" htmlFor="s-reviewThemes" error={errors.reviewThemes} hint="Shown as social proof; never invent quotes"><Textarea {...text("reviewThemes")} className="min-h-[140px]" /></Field>
          <Field label="Slogans (one per line)" htmlFor="s-slogans" error={errors.slogans} hint="Ticker and social section"><Textarea {...text("slogans")} className="min-h-[140px]" /></Field>
          <Field label="Menu notes (one per line)" htmlFor="s-menuNotes" error={errors.menuNotes} className="sm:col-span-2" hint="Printed under the menu, e.g. allergy note"><Textarea {...text("menuNotes")} /></Field>
        </div>
      </Card>
    </form>
  );
}

export function HeroStoryForm({ info, library }: { info: RestaurantInfo; library: Lib }) {
  const { f, set, text, errors, busy, submit } = useSettingsForm(
    { heroEyebrow: info.heroEyebrow ?? "", heroHeadline: info.heroHeadline ?? "", heroSubheadline: info.heroSubheadline ?? "", heroImage: info.heroImage ?? "", heroImageAlt: info.heroImageAlt ?? "", storyHeading: info.storyHeading ?? "", story: info.story ?? "" },
    "Hero & story saved",
  );
  return (
    <form onSubmit={submit} id="story">
      <Card title="Homepage hero & story" description="The hero copy and the “Our story” section. The story is empty until you write it; the site shows the verified concept meanwhile." actions={<Btn type="submit" variant="primary" loading={busy}>Save hero & story</Btn>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero eyebrow" htmlFor="s-heroEyebrow" error={errors.heroEyebrow} hint="Small line above the headline, e.g. El Paso, TX"><Input {...text("heroEyebrow")} /></Field>
          <Field label="Hero headline" htmlFor="s-heroHeadline" error={errors.heroHeadline} hint="The last word is highlighted"><Input {...text("heroHeadline")} /></Field>
          <Field label="Hero supporting statement" htmlFor="s-heroSubheadline" error={errors.heroSubheadline} className="sm:col-span-2"><Textarea {...text("heroSubheadline")} /></Field>
          <Field label="Hero photo" className="sm:col-span-2"><ImageUpload value={f.heroImage} onChange={(v) => set("heroImage", v)} library={library} altSuggestion="Hero photo" /></Field>
          <Field label="Hero photo alt text" htmlFor="s-heroImageAlt" error={errors.heroImageAlt} className="sm:col-span-2"><Input {...text("heroImageAlt")} /></Field>
          <Field label="Story heading" htmlFor="s-storyHeading" error={errors.storyHeading} className="sm:col-span-2" hint="Optional; defaults to “The abuela on the sign is Tina.”"><Input {...text("storyHeading")} /></Field>
          <Field label="About Tina / our story" htmlFor="s-story" error={errors.story} className="sm:col-span-2" hint="Blank lines separate paragraphs"><Textarea {...text("story")} className="min-h-[180px]" placeholder="Who is Tina? When did you open? What's the family story?" /></Field>
        </div>
      </Card>
    </form>
  );
}

export function LinksForm({ info }: { info: RestaurantInfo }) {
  const { f, set, text, errors, busy, submit } = useSettingsForm(
    { website: info.website ?? "", instagramUrl: info.instagramUrl ?? "", instagramHandle: info.instagramHandle ?? "", facebookUrl: info.facebookUrl ?? "", facebookName: info.facebookName ?? "", tiktokUrl: info.tiktokUrl ?? "", tiktokHandle: info.tiktokHandle ?? "", orderingUrl: info.orderingUrl ?? "", orderingEnabled: info.orderingEnabled, legacyMenuUrl: info.legacyMenuUrl ?? "" },
    "Links saved",
  );
  return (
    <form onSubmit={submit} id="links">
      <Card title="Social & online ordering" description="Social profiles for “Follow Tina” and the footer, plus the existing FromTheRestaurant / FOX Ordering link for the Order Online button." actions={<Btn type="submit" variant="primary" loading={busy}>Save links</Btn>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram URL" htmlFor="s-instagramUrl" error={errors.instagramUrl}><Input {...text("instagramUrl")} placeholder="https://" /></Field>
          <Field label="Instagram handle" htmlFor="s-instagramHandle" error={errors.instagramHandle}><Input {...text("instagramHandle")} placeholder="@restaurantina_" /></Field>
          <Field label="Facebook URL" htmlFor="s-facebookUrl" error={errors.facebookUrl}><Input {...text("facebookUrl")} placeholder="https://" /></Field>
          <Field label="Facebook page name" htmlFor="s-facebookName" error={errors.facebookName}><Input {...text("facebookName")} /></Field>
          <Field label="TikTok URL" htmlFor="s-tiktokUrl" error={errors.tiktokUrl}><Input {...text("tiktokUrl")} placeholder="https://" /></Field>
          <Field label="TikTok handle" htmlFor="s-tiktokHandle" error={errors.tiktokHandle}><Input {...text("tiktokHandle")} placeholder="@restaurantina" /></Field>
          <Field label="Website" htmlFor="s-website" error={errors.website}><Input {...text("website")} placeholder="https://" /></Field>
          <Field label="Old online menu URL" htmlFor="s-legacyMenuUrl" error={errors.legacyMenuUrl} hint="Reference only"><Input {...text("legacyMenuUrl")} placeholder="https://" /></Field>
          <Field label="Online ordering URL" htmlFor="s-orderingUrl" error={errors.orderingUrl} hint="Pickup + delivery provider (FOX Ordering)"><Input {...text("orderingUrl")} placeholder="https://" /></Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-[14px] text-zinc-800"><input type="checkbox" checked={f.orderingEnabled} onChange={(e) => set("orderingEnabled", e.target.checked)} className="h-4 w-4 accent-zinc-900" /> Show the Order Online button</label>
          </div>
        </div>
      </Card>
    </form>
  );
}

export function SeoForm({ info, library }: { info: RestaurantInfo; library: Lib }) {
  const { f, set, text, errors, busy, submit } = useSettingsForm({ seoTitle: info.seoTitle ?? "", seoDescription: info.seoDescription ?? "", ogImageUrl: info.ogImageUrl ?? "", hoursNote: info.hoursNote ?? "" }, "SEO saved");
  return (
    <form onSubmit={submit} id="seo">
      <Card title="SEO" description="Page title, description and share image for search engines and social previews." actions={<Btn type="submit" variant="primary" loading={busy}>Save SEO</Btn>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Homepage title" htmlFor="s-seoTitle" error={errors.seoTitle} className="sm:col-span-2"><Input {...text("seoTitle")} /></Field>
          <Field label="Meta description" htmlFor="s-seoDescription" error={errors.seoDescription} className="sm:col-span-2"><Textarea {...text("seoDescription")} /></Field>
          <Field label="Share image (Open Graph)" className="sm:col-span-2"><ImageUpload value={f.ogImageUrl} onChange={(v) => set("ogImageUrl", v)} library={library} altSuggestion="Share image" /></Field>
          <Field label="Public hours note" htmlFor="s-hoursNote" error={errors.hoursNote} className="sm:col-span-2" hint='Optional line under the hours, e.g. "Holiday hours may vary"'><Input {...text("hoursNote")} /></Field>
        </div>
      </Card>
    </form>
  );
}

export function LegalForm({ info }: { info: RestaurantInfo }) {
  const { text, errors, busy, submit } = useSettingsForm({ privacyPolicy: info.privacyPolicy ?? "", termsOfService: info.termsOfService ?? "" }, "Legal pages saved");
  return (
    <form onSubmit={submit} id="legal">
      <Card title="Privacy & terms" description="Shown at /privacy and /terms (linked from the footer). Blank lines separate paragraphs." actions={<Btn type="submit" variant="primary" loading={busy}>Save legal pages</Btn>}>
        <div className="grid gap-4">
          <Field label="Privacy policy" htmlFor="s-privacyPolicy" error={errors.privacyPolicy}><Textarea {...text("privacyPolicy")} className="min-h-[160px]" /></Field>
          <Field label="Terms of service" htmlFor="s-termsOfService" error={errors.termsOfService}><Textarea {...text("termsOfService")} className="min-h-[160px]" /></Field>
        </div>
      </Card>
    </form>
  );
}
