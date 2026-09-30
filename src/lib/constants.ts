import type { DietaryTag, HoursCategory, MediaTag, ReservationStatus } from "@/db/schema";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const DIETARY_LABELS: Record<DietaryTag, { label: string; short: string; description: string }> = {
  vegetarian: { label: "Vegetarian", short: "V", description: "Vegetarian" },
  vegan: { label: "Vegan", short: "VG", description: "Vegan" },
  "gluten-free": { label: "Gluten-free", short: "GF", description: "Gluten-free" },
  spicy: { label: "Spicy", short: "Pica", description: "Spicy" },
  "contains-nuts": { label: "Contains nuts", short: "Nuts", description: "Contains nuts" },
  "contains-dairy": { label: "Contains dairy", short: "Dairy", description: "Contains dairy" },
};

export const DIETARY_FILTERS = [
  { key: "vegetarian", label: "Vegetarian", matches: ["vegetarian", "vegan"] },
  { key: "vegan", label: "Vegan", matches: ["vegan"] },
  { key: "gluten-free", label: "Gluten-free", matches: ["gluten-free"] },
  { key: "spicy", label: "Spicy", matches: ["spicy"] },
] as const satisfies ReadonlyArray<{ key: string; label: string; matches: readonly DietaryTag[] }>;

export type DietaryFilterKey = (typeof DIETARY_FILTERS)[number]["key"];

export const HOURS_CATEGORY_LABELS: Record<HoursCategory, string> = {
  store: "Restaurant hours",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export const MEDIA_TAG_LABELS: Record<MediaTag, string> = {
  food: "Food",
  menu: "Menu",
  gallery: "Gallery",
  hero: "Hero",
  brand: "Brand",
  interior: "The room",
  other: "Other",
};

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3200");
