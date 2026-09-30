import type { DietaryTag } from "../schema";

/** dollars → cents */
export const $ = (dollars: number) => Math.round(dollars * 100);

export const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;

export type SeedAvailability = { days?: number[]; start?: string; end?: string };

export type SeedItem = {
  /** Name exactly as printed on the source menu. */
  name: string;
  spanishName?: string;
  englishName?: string;
  slug?: string;
  /** cents; null/undefined = no price shown */
  price?: number | null;
  priceNote?: string;
  description?: string;
  englishDescription?: string;
  dietary?: DietaryTag[];
  notes?: string;
  availability?: SeedAvailability[];
  availabilityNote?: string;
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  popular?: boolean;
  modifierGroups?: string[];
};

export type SeedCategory = {
  name: string;
  englishName?: string;
  slug: string;
  description?: string;
  englishDescription?: string;
  note?: string;
  englishNote?: string;
  image?: string;
  items: SeedItem[];
};

export type SeedModifier = { name: string; price?: number; description?: string };
export type SeedModifierGroup = { key: string; name: string; description?: string; required?: boolean; min?: number; max?: number; modifiers: SeedModifier[] };

export type SeedPhoto = {
  file: string;
  alt: string;
  caption?: string;
  tag: "food" | "menu" | "gallery" | "hero" | "brand" | "interior" | "other";
  width: number;
  height: number;
  featured?: boolean;
  inGallery?: boolean;
  focalX?: number;
  focalY?: number;
  sourceUrl?: string;
};
