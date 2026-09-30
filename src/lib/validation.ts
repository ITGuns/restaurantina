import { z } from "zod";
import { DIETARY_TAGS, FEATURED_PHONES, HOURS_CATEGORIES, MEDIA_TAGS, RESERVATION_STATUSES } from "@/db/schema";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");
const optionalHhmm = z.union([hhmm, z.literal(""), z.null()]).transform((v) => (v ? v : null));
const phone = z
  .string()
  .trim()
  .min(7, "Enter a phone number")
  .max(25)
  .regex(/^[\d\s()+.-]+$/, "Enter a valid phone number");
const emptyToNull = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v ? v : null))
    .nullable()
    .optional();
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v ? v : null))
  .refine((v) => v == null || /^https?:\/\/\S+$/.test(v), "Enter a full URL starting with https://")
  .nullable()
  .optional();
const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .transform((v) => (v ? v : null))
  .refine((v) => v == null || z.email().safeParse(v).success, "Enter a valid email")
  .nullable()
  .optional();
const optionalNumber = (min: number, max: number) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v, ctx) => {
      if (v === "" || v == null) return null;
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `Enter a number between ${min} and ${max}` });
        return z.NEVER;
      }
      return n;
    });

/** cents from a dollar string / number; "" → null */
const cents = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (v === "" || v == null) return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[$,\s]/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a valid price" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

const daysArray = z
  .array(z.coerce.number().int().min(0).max(6))
  .transform((a) => [...new Set(a)].sort())
  .default([]);

const stringList = (max = 200) => z.array(z.string().trim().min(1).max(max)).default([]);
/** Same, but absent when not sent (so partial settings saves never wipe a list). */
const optionalStringList = (max = 200) => z.array(z.string().trim().min(1).max(max)).optional();

/* ---------------- Public ---------------- */

export const reservationInput = z.object({
  date: ymd,
  time: hhmm,
  partySize: z.coerce.number().int().min(1).max(50),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.email("Enter a valid email").max(120),
  phone,
  occasion: emptyToNull(60),
  specialRequests: emptyToNull(500),
  idempotencyKey: z.string().trim().min(8).max(64),
});
export type ReservationInput = z.infer<typeof reservationInput>;

export const loginInput = z.object({
  email: z.email().max(120),
  password: z.string().min(1).max(200),
});

/* ---------------- Admin: menu ---------------- */

export const categoryInput = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  englishName: emptyToNull(80),
  slug: z.string().trim().max(80).optional(),
  description: emptyToNull(500),
  englishDescription: emptyToNull(500),
  note: emptyToNull(200),
  englishNote: emptyToNull(200),
  image: emptyToNull(300),
  active: z.coerce.boolean().default(true),
});

export const availabilityWindowInput = z.object({
  days: daysArray,
  startTime: optionalHhmm.optional(),
  endTime: optionalHhmm.optional(),
  active: z.coerce.boolean().default(true),
});

export const menuItemInput = z.object({
  id: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  spanishName: emptyToNull(120),
  englishName: emptyToNull(120),
  slug: z.string().trim().max(120).optional(),
  description: emptyToNull(600),
  englishDescription: emptyToNull(600),
  price: cents,
  priceNote: emptyToNull(60),
  image: emptyToNull(300),
  imageAlt: emptyToNull(200),
  dietaryTags: z.array(z.enum(DIETARY_TAGS)).default([]),
  availabilityNote: emptyToNull(80),
  availability: z.array(availabilityWindowInput).default([]),
  notes: emptyToNull(300),
  featured: z.coerce.boolean().default(false),
  popular: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  modifierGroupIds: z.array(z.coerce.number().int()).default([]),
});
export type MenuItemInput = z.infer<typeof menuItemInput>;

export const modifierGroupInput = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1).max(80),
  description: emptyToNull(200),
  required: z.coerce.boolean().default(false),
  minSelections: z.coerce.number().int().min(0).max(20).default(0),
  maxSelections: z.coerce.number().int().min(1).max(20).default(1),
  active: z.coerce.boolean().default(true),
});

export const modifierInput = z.object({
  id: z.coerce.number().int().optional(),
  groupId: z.coerce.number().int(),
  name: z.string().trim().min(1).max(80),
  description: emptyToNull(200),
  priceAdjustment: cents.transform((v) => v ?? 0),
  active: z.coerce.boolean().default(true),
});

/* ---------------- Admin: media ---------------- */

export const mediaInput = z.object({
  id: z.coerce.number().int(),
  alt: z.string().trim().min(1, "Alt text is required for accessibility").max(200),
  caption: emptyToNull(200),
  tag: z.enum(MEDIA_TAGS).default("other"),
  focalX: z.coerce.number().int().min(0).max(100).default(50),
  focalY: z.coerce.number().int().min(0).max(100).default(50),
  featured: z.coerce.boolean().default(false),
  inGallery: z.coerce.boolean().default(true),
  active: z.coerce.boolean().default(true),
});

/* ---------------- Admin: hours + booking ---------------- */

export const hoursRowInput = z.object({
  category: z.enum(HOURS_CATEGORIES),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  opensAt: optionalHhmm,
  closesAt: optionalHhmm,
  isClosed: z.coerce.boolean().default(false),
  note: emptyToNull(300),
});

export const bookingSettingsInput = z.object({
  slotIntervalMinutes: z.coerce.number().int().min(5).max(120),
  turnTimeMinutes: z.coerce.number().int().min(15).max(360),
  minPartySize: z.coerce.number().int().min(1).max(50),
  maxPartySize: z.coerce.number().int().min(1).max(50),
  largePartyThreshold: z.coerce.number().int().min(1).max(51),
  maxBookingsPerSlot: z.coerce.number().int().min(1).max(100),
  maxCoversPerSlot: z.coerce.number().int().min(1).max(500),
  minLeadTimeMinutes: z.coerce.number().int().min(0).max(10080),
  maxDaysInAdvance: z.coerce.number().int().min(1).max(365),
  autoConfirm: z.coerce.boolean().default(true),
  bookingsEnabled: z.coerce.boolean().default(true),
  occasions: stringList(60),
});

export const bookingWindowInput = z.object({
  id: z.coerce.number().int().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: hhmm,
  endTime: hhmm,
  label: emptyToNull(60),
  active: z.coerce.boolean().default(true),
});

export const dateOverrideInput = z.object({
  id: z.coerce.number().int().optional(),
  date: ymd,
  closed: z.coerce.boolean().default(true),
  startTime: optionalHhmm.optional(),
  endTime: optionalHhmm.optional(),
  isHoliday: z.coerce.boolean().default(false),
  reason: emptyToNull(160),
});

/** Every settings field. Forms send a subset; the action applies only the keys present. */
export const restaurantInfoInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    tagline: z.string().trim().min(1).max(200),
    category: z.string().trim().max(120),
    description: z.string().trim().max(1000),
    storyHeading: emptyToNull(120),
    story: emptyToNull(4000),
    addressLine1: z.string().trim().min(1).max(120),
    addressLine2: emptyToNull(120),
    city: z.string().trim().min(1).max(60),
    state: z.string().trim().min(2).max(20),
    zip: z.string().trim().min(3).max(12),
    latitude: optionalNumber(-90, 90),
    longitude: optionalNumber(-180, 180),
    googlePlaceId: emptyToNull(120),
    googleMapsUrl: optionalUrl,
    phonePrimary: phone,
    phoneSecondary: z
      .string()
      .trim()
      .max(25)
      .transform((v) => (v ? v : null))
      .refine((v) => v == null || /^[\d\s()+.-]{7,}$/.test(v), "Enter a valid phone number")
      .nullable()
      .optional(),
    featuredPhone: z.enum(FEATURED_PHONES),
    phoneConfirmed: z.coerce.boolean(),
    email: optionalEmail,
    website: optionalUrl,
    instagramUrl: optionalUrl,
    instagramHandle: emptyToNull(60),
    facebookUrl: optionalUrl,
    facebookName: emptyToNull(80),
    tiktokUrl: optionalUrl,
    tiktokHandle: emptyToNull(60),
    orderingUrl: optionalUrl,
    orderingEnabled: z.coerce.boolean(),
    legacyMenuUrl: optionalUrl,
    rating: z
      .string()
      .trim()
      .max(4)
      .transform((v) => (v ? v : null))
      .refine((v) => v == null || (/^\d(\.\d)?$/.test(v) && Number(v) <= 5), "Rating must be 0–5, e.g. 4.7")
      .nullable()
      .optional(),
    reviewCount: z
      .union([z.coerce.number().int().min(0).max(1_000_000), z.literal(""), z.null()])
      .transform((v) => (v === "" || v == null ? null : v))
      .optional(),
    priceRange: emptyToNull(40),
    reviewThemes: optionalStringList(120),
    slogans: optionalStringList(120),
    menuNotes: optionalStringList(200),
    logo: emptyToNull(300),
    heroImage: emptyToNull(300),
    heroImageAlt: emptyToNull(200),
    heroEyebrow: emptyToNull(60),
    heroHeadline: emptyToNull(120),
    heroSubheadline: emptyToNull(300),
    hoursConfirmed: z.coerce.boolean(),
    hoursNote: emptyToNull(200),
    seoTitle: emptyToNull(120),
    seoDescription: emptyToNull(300),
    ogImageUrl: emptyToNull(300),
    privacyPolicy: emptyToNull(6000),
    termsOfService: emptyToNull(6000),
  })
  .partial();
export type RestaurantInfoInput = z.infer<typeof restaurantInfoInput>;

/* ---------------- Admin: reservations ---------------- */

export const adminReservationInput = z.object({
  id: z.coerce.number().int().optional(),
  date: ymd,
  time: hhmm,
  partySize: z.coerce.number().int().min(1).max(100),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.email().max(120),
  phone,
  occasion: emptyToNull(60),
  specialRequests: emptyToNull(500),
  internalNotes: emptyToNull(500),
  status: z.enum(RESERVATION_STATUSES).default("confirmed"),
});

export const statusInput = z.enum(RESERVATION_STATUSES);

/** Flatten zod issues into { field: message } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
