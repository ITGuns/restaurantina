import { sql } from "drizzle-orm";
import { boolean, customType, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Shared vocab                                                        */
/* ------------------------------------------------------------------ */

export const DIETARY_TAGS = ["vegetarian", "vegan", "gluten-free", "spicy", "contains-nuts", "contains-dairy"] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Operating-hours groups (only the restaurant itself for now). */
export const HOURS_CATEGORIES = ["store"] as const;
export type HoursCategory = (typeof HOURS_CATEGORIES)[number];

export const MEDIA_TAGS = ["food", "menu", "gallery", "hero", "brand", "interior", "other"] as const;
export type MediaTag = (typeof MEDIA_TAGS)[number];

export const FEATURED_PHONES = ["primary", "secondary"] as const;
export type FeaturedPhone = (typeof FEATURED_PHONES)[number];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
};
const autoId = () => integer("id").primaryKey().generatedByDefaultAsIdentity();
const jsonArray = <T>(name: string) => jsonb(name).$type<T>().notNull().default(sql`'[]'::jsonb`);

export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/* ------------------------------------------------------------------ */
/* Restaurant + settings                                               */
/* ------------------------------------------------------------------ */

/**
 * Single-row settings entity. Everything the source file could not settle
 * (featured phone, hours, story, email, ordering link…) lives here so the
 * owner can correct it from /admin/settings without a code change.
 */
export const restaurantInfo = pgTable("restaurant_info", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  /** Owner-written "About Tina" story. Null = show the concept-based placeholder. */
  storyHeading: text("story_heading"),
  story: text("story"),

  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  googlePlaceId: text("google_place_id"),
  googleMapsUrl: text("google_maps_url"),

  phonePrimary: text("phone_primary").notNull(),
  phoneSecondary: text("phone_secondary"),
  /** Which number is shown across the site. The source lists two; the owner confirms. */
  featuredPhone: text("featured_phone").$type<FeaturedPhone>().notNull().default("primary"),
  phoneConfirmed: boolean("phone_confirmed").notNull().default(false),
  email: text("email"),
  website: text("website"),

  instagramUrl: text("instagram_url"),
  instagramHandle: text("instagram_handle"),
  facebookUrl: text("facebook_url"),
  facebookName: text("facebook_name"),
  tiktokUrl: text("tiktok_url"),
  tiktokHandle: text("tiktok_handle"),

  /** Existing FromTheRestaurant / FOX Ordering link (pickup + delivery). */
  orderingUrl: text("ordering_url"),
  orderingEnabled: boolean("ordering_enabled").notNull().default(true),
  legacyMenuUrl: text("legacy_menu_url"),

  rating: text("rating"),
  reviewCount: integer("review_count"),
  priceRange: text("price_range"),
  /** Themes reviewers mention (from the source). Shown as social proof, never as quotes. */
  reviewThemes: jsonArray<string[]>("review_themes"),
  /** Recurring slogans from social posts. */
  slogans: jsonArray<string[]>("slogans"),
  /** Menu-wide notes from the source menu. */
  menuNotes: jsonArray<string[]>("menu_notes"),

  logo: text("logo"),
  heroImage: text("hero_image"),
  heroImageAlt: text("hero_image_alt"),
  heroEyebrow: text("hero_eyebrow"),
  heroHeadline: text("hero_headline"),
  heroSubheadline: text("hero_subheadline"),

  /** False until the owner confirms which of the three conflicting hour sets is right. */
  hoursConfirmed: boolean("hours_confirmed").notNull().default(false),
  /** Optional public note under the hours (e.g. "Holiday hours may vary"). */
  hoursNote: text("hours_note"),

  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ogImageUrl: text("og_image_url"),

  privacyPolicy: text("privacy_policy"),
  termsOfService: text("terms_of_service"),
  ...timestamps,
});

export const hours = pgTable(
  "hours",
  {
    id: autoId(),
    category: text("category").$type<HoursCategory>().notNull(),
    /** 0 = Sunday … 6 = Saturday */
    dayOfWeek: integer("day_of_week").notNull(),
    /** "HH:MM" 24h */
    opensAt: text("opens_at"),
    closesAt: text("closes_at"),
    isClosed: boolean("is_closed").notNull().default(false),
    note: text("note"),
    ...timestamps,
  },
  (t) => [uniqueIndex("hours_category_day_idx").on(t.category, t.dayOfWeek)],
);

export const bookingSettings = pgTable("booking_settings", {
  id: integer("id").primaryKey(),
  slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(30),
  turnTimeMinutes: integer("turn_time_minutes").notNull().default(75),
  minPartySize: integer("min_party_size").notNull().default(1),
  maxPartySize: integer("max_party_size").notNull().default(8),
  largePartyThreshold: integer("large_party_threshold").notNull().default(7),
  maxBookingsPerSlot: integer("max_bookings_per_slot").notNull().default(6),
  maxCoversPerSlot: integer("max_covers_per_slot").notNull().default(30),
  minLeadTimeMinutes: integer("min_lead_time_minutes").notNull().default(60),
  maxDaysInAdvance: integer("max_days_in_advance").notNull().default(60),
  autoConfirm: boolean("auto_confirm").notNull().default(true),
  bookingsEnabled: boolean("bookings_enabled").notNull().default(true),
  occasions: jsonArray<string[]>("occasions"),
  timezone: text("timezone").notNull().default("America/Denver"),
  ...timestamps,
});

/** Weekly first/last seating windows for online reservations. */
export const bookingWindows = pgTable(
  "booking_windows",
  {
    id: autoId(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    label: text("label"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("booking_windows_day_idx").on(t.dayOfWeek)],
);

/** Blackout dates, holiday hours, temporary closures and special events. */
export const dateOverrides = pgTable(
  "date_overrides",
  {
    id: autoId(),
    /** YYYY-MM-DD */
    date: text("date").notNull(),
    closed: boolean("closed").notNull().default(true),
    startTime: text("start_time"),
    endTime: text("end_time"),
    isHoliday: boolean("is_holiday").notNull().default(false),
    reason: text("reason"),
    ...timestamps,
  },
  (t) => [uniqueIndex("date_overrides_date_idx").on(t.date)],
);

/* ------------------------------------------------------------------ */
/* Reservations                                                        */
/* ------------------------------------------------------------------ */

export const reservations = pgTable(
  "reservations",
  {
    id: autoId(),
    confirmationCode: text("confirmation_code").notNull(),
    manageToken: text("manage_token").notNull(),
    idempotencyKey: text("idempotency_key"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    partySize: integer("party_size").notNull(),
    /** YYYY-MM-DD */
    date: text("date").notNull(),
    /** HH:MM */
    time: text("time").notNull(),
    occasion: text("occasion"),
    specialRequests: text("special_requests"),
    status: text("status").$type<ReservationStatus>().notNull().default("pending"),
    source: text("source").notNull().default("web"),
    internalNotes: text("internal_notes"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("reservations_code_idx").on(t.confirmationCode),
    uniqueIndex("reservations_idem_idx").on(t.idempotencyKey),
    index("reservations_date_idx").on(t.date, t.time),
    index("reservations_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

export const menuCategories = pgTable(
  "menu_categories",
  {
    id: autoId(),
    name: text("name").notNull(),
    englishName: text("english_name"),
    slug: text("slug").notNull(),
    description: text("description"),
    englishDescription: text("english_description"),
    /** Source note shown under the category, e.g. "Todos acompañados de frijoles con queso" */
    note: text("note"),
    englishNote: text("english_note"),
    image: text("image"),
    displayOrder: integer("display_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("menu_categories_slug_idx").on(t.slug)],
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: autoId(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => menuCategories.id, { onDelete: "cascade" }),
    /** Display name exactly as printed on the menu (Spanish, often playful slang). */
    name: text("name").notNull(),
    spanishName: text("spanish_name"),
    englishName: text("english_name"),
    slug: text("slug").notNull(),
    description: text("description"),
    englishDescription: text("english_description"),
    /** cents; null = no price shown (see priceNote) */
    price: integer("price"),
    priceNote: text("price_note"),
    image: text("image"),
    imageAlt: text("image_alt"),
    dietaryTags: jsonArray<DietaryTag[]>("dietary_tags"),
    /** Badge text, e.g. "Weekends only" */
    availabilityNote: text("availability_note"),
    notes: text("notes"),
    featured: boolean("featured").notNull().default(false),
    popular: boolean("popular").notNull().default(false),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("menu_items_category_idx").on(t.categoryId), uniqueIndex("menu_items_slug_idx").on(t.slug), index("menu_items_featured_idx").on(t.featured)],
);

/** When an item is only served on certain days/times. No rows = follows restaurant hours. */
export const menuAvailability = pgTable(
  "menu_availability",
  {
    id: autoId(),
    itemId: integer("item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    /** 0 = Sunday … 6 = Saturday; empty = every day */
    days: jsonArray<number[]>("days"),
    startTime: text("start_time"),
    endTime: text("end_time"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("menu_availability_item_idx").on(t.itemId)],
);

export const modifierGroups = pgTable("modifier_groups", {
  id: autoId(),
  key: text("key"),
  name: text("name").notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(false),
  minSelections: integer("min_selections").notNull().default(0),
  maxSelections: integer("max_selections").notNull().default(1),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const modifiers = pgTable(
  "modifiers",
  {
    id: autoId(),
    groupId: integer("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    /** cents; 0 = included */
    priceAdjustment: integer("price_adjustment").notNull().default(0),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("modifiers_group_idx").on(t.groupId)],
);

export const menuItemModifierGroups = pgTable(
  "menu_item_modifier_groups",
  {
    itemId: integer("item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.groupId] })],
);

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

/** Image library: gallery photos, hero/section imagery and menu item photos. */
export const media = pgTable("media", {
  id: autoId(),
  /** "/images/…" (bundled) or "/uploads/…" (admin upload) */
  file: text("file").notNull(),
  alt: text("alt").notNull(),
  caption: text("caption"),
  tag: text("tag").$type<MediaTag>().notNull().default("other"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  /** focal point as percentages, used for object-position */
  focalX: integer("focal_x").notNull().default(50),
  focalY: integer("focal_y").notNull().default(50),
  featured: boolean("featured").notNull().default(false),
  inGallery: boolean("in_gallery").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sourceUrl: text("source_url"),
  ...timestamps,
});

/** Admin-uploaded image bytes, stored in Postgres so deployments need no disk or bucket. */
export const uploads = pgTable(
  "uploads",
  {
    id: autoId(),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uploads_name_idx").on(t.name)],
);

/* ------------------------------------------------------------------ */
/* Admin auth                                                          */
/* ------------------------------------------------------------------ */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: autoId(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** scrypt: salt:hash (hex) */
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    /** Bumped on sign-out / password change so previously issued session tokens stop working. */
    tokenVersion: integer("token_version").notNull().default(0),
    lastLoginAt: text("last_login_at"),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type RestaurantInfo = typeof restaurantInfo.$inferSelect;
export type Hours = typeof hours.$inferSelect;
export type BookingSettings = typeof bookingSettings.$inferSelect;
export type BookingWindow = typeof bookingWindows.$inferSelect;
export type DateOverride = typeof dateOverrides.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type MenuAvailability = typeof menuAvailability.$inferSelect;
export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type Modifier = typeof modifiers.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
