/**
 * Restaurant facts transcribed from restaurantina-data.md (scraped 2026-09-30 from
 * restaurantinatx.com, Instagram, Facebook, TikTok and Google Business Profile).
 * Nothing here is invented; anything the source does not state is null / empty
 * and can be filled in from the admin dashboard.
 */
import type { HoursCategory } from "../schema";
import { $, FRI, MON, SAT, SUN, THU, TUE, WED } from "./types";
import type { SeedPhoto } from "./types";

export const RESTAURANT = {
  id: 1,
  name: "RestauranTina",
  tagline: "Authentic Mexican Cuisine",
  category: "Mexican restaurant · Mexican café",
  description:
    "Home-style Mexican comfort food made from scratch in El Paso, TX: caldos, chilaquiles, menudo, pozole, albóndigas, chiles rellenos, fresh tortillas, café de la olla, pan dulce and desserts, served on Talavera-style clay plates.",
  // "About Tina" copy is an open question for the owner (source §9). Null shows the concept-based section.
  storyHeading: null,
  story: null,

  addressLine1: "12115 Montwood Dr Ste 201B",
  addressLine2: null,
  city: "El Paso",
  state: "TX",
  zip: "79936",
  latitude: 31.7615158,
  longitude: -106.2721195,
  googlePlaceId: "ChIJyQtnZgBF54YROye-51Ttppw",
  googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJyQtnZgBF54YROye-51Ttppw",

  // Two numbers appear in the wild (source §2). 259-8774 is on Google, Facebook, TikTok and the ordering
  // page; 268-1543 only on the old homepage. The owner picks the featured one under Admin → Settings.
  phonePrimary: "(915) 259-8774",
  phoneSecondary: "(915) 268-1543",
  featuredPhone: "primary" as const,
  phoneConfirmed: false,
  email: null,
  website: "https://www.restaurantinatx.com/",

  instagramUrl: "https://www.instagram.com/restaurantina_/",
  instagramHandle: "@restaurantina_",
  facebookUrl: "https://www.facebook.com/p/Restauran-Tina-61589615797924/",
  facebookName: "Restauran Tina",
  tiktokUrl: "https://www.tiktok.com/@restaurantina",
  tiktokHandle: "@restaurantina",

  orderingUrl: "https://www.restaurantinatx.com/restaurantina/",
  orderingEnabled: true,
  legacyMenuUrl: "https://www.restaurantinatx.com/restaurantina/menu",

  rating: "4.7",
  reviewCount: 72,
  priceRange: "$10–20 per person",
  reviewThemes: [
    "Everything made from scratch, even the tortillas",
    "Salsas that are spicy and good",
    "Friendly, attentive, welcoming staff",
    "Beautiful restaurant, great prices",
    "The bill arrives in a little tote bag",
    "Chipotle enchiladas like nothing else",
    "Amazing desserts",
  ],
  slogans: ["Aquí te esperamos en RestauranTina", "Ven y prueba la milagrosa", "Restaurantina + DJ = Plan Perfecto"],
  menuNotes: [
    "Todos los desayunos son acompañados de frijoles con queso",
    "Todos los platillos de comida son servidos con arroz y frijoles",
    "Please call for allergy information",
  ],

  logo: "/images/logo.png",
  heroImage: "/images/food-1.jpg",
  heroImageAlt: "Red enchiladas with crema and crumbled cheese on a Talavera-style clay plate with lettuce, tomato, avocado and lime",
  heroEyebrow: "El Paso, TX",
  heroHeadline: "Authentic Mexican Cuisine",
  heroSubheadline: "Home-style Mexican comfort food made from scratch: caldos, chilaquiles, menudo, pozole and fresh tortillas, served on Talavera-style clay plates.",

  hoursConfirmed: false,
  hoursNote: null,

  seoTitle: "RestauranTina — Authentic Mexican Cuisine · El Paso, TX",
  seoDescription:
    "RestauranTina serves home-style Mexican comfort food made from scratch in El Paso, TX: menudo, pozole, chilaquiles, enchiladas, fresh tortillas, café de la olla and desserts on Talavera-style clay plates. Reserve a table online.",
  ogImageUrl: "/images/food-1.jpg",

  privacyPolicy:
    "RestauranTina collects the name, email address, phone number, party size, date, time and any special requests you enter when you reserve a table. We use this information only to hold your table, contact you about your reservation and keep a record of bookings for the restaurant. We do not sell or share your details with third parties, except services needed to run this website. Reservation records are kept for the restaurant's own operations; ask us to remove yours by contacting the restaurant.",
  termsOfService:
    "Online reservations are a request to hold a table at the date and time you choose and are subject to the confirmation shown on screen. Please arrive on time; if your plans change, cancel through the link in your confirmation or call the restaurant so the table can be released. Menu items and prices are shown as configured by the restaurant and may change without notice. Please call the restaurant for allergy information.",
};

type HoursRow = {
  category: HoursCategory;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed?: boolean;
  note?: string;
};

const days = (list: number[], row: Omit<HoursRow, "dayOfWeek">): HoursRow[] => list.map((dayOfWeek) => ({ dayOfWeek, ...row }));

/**
 * Seeded from the restaurant's own website (source §3). Google Business and social posts
 * disagree; all three sets are listed in src/lib/source.ts and shown under Admin → Hours so the
 * owner can apply the correct one. `hoursConfirmed` stays false until they do.
 */
export const HOURS: HoursRow[] = [
  ...days([MON, TUE, WED, THU, FRI, SAT], { category: "store", opensAt: "09:00", closesAt: "19:00" }),
  ...days([SUN], { category: "store", opensAt: "09:00", closesAt: "17:00" }),
];

/**
 * Default reservation rules. These are NOT from the source (the old site had no
 * booking system); they are derived from the hours and are fully editable in
 * /admin/settings and /admin/hours.
 */
export const BOOKING_SETTINGS = {
  id: 1,
  slotIntervalMinutes: 30,
  turnTimeMinutes: 75,
  minPartySize: 1,
  maxPartySize: 8,
  largePartyThreshold: 7,
  maxBookingsPerSlot: 6,
  maxCoversPerSlot: 30,
  minLeadTimeMinutes: 60,
  maxDaysInAdvance: 60,
  autoConfirm: true,
  bookingsEnabled: true,
  occasions: ["Birthday", "Anniversary", "Family gathering", "Business meal", "Celebration", "Just hungry"],
  // El Paso, TX observes Mountain Time.
  timezone: "America/Denver",
};

/** First seating at opening, last seating 60 minutes before close (derived from the seeded hours; editable). */
export const BOOKING_WINDOWS = [
  ...[MON, TUE, WED, THU, FRI, SAT].map((dayOfWeek) => ({ dayOfWeek, startTime: "09:00", endTime: "18:00", label: "Desayuno y comida" })),
  { dayOfWeek: SUN, startTime: "09:00", endTime: "16:00", label: "Desayuno y comida" },
];

const CDN = "https://d2gqo3h0psesgi.cloudfront.net/auto";

/** The logo and the three food photos from the previous website (source §5), described from the actual images. */
export const MEDIA: SeedPhoto[] = [
  {
    file: "food-1.jpg",
    alt: "Red enchiladas topped with crema and crumbled cheese on a Talavera-style clay plate with shredded lettuce, tomato wedges, avocado and lime; clay jarritos and a Talavera ceramic bird sit behind",
    caption: "Enchiladas on a Talavera-style clay plate",
    tag: "food",
    width: 1000,
    height: 1000,
    featured: true,
    focalX: 50,
    focalY: 62,
    sourceUrl: `${CDN}/restaurantina-d6hr9pml-food1.jpg`,
  },
  {
    file: "food-2.jpg",
    alt: "Steak tacos on corn tortillas with grilled green onions, avocado, radish slices, cilantro, lime and red and green salsas on a Talavera-style clay plate",
    caption: "Tacos de bistec with grilled cebollitas and two salsas",
    tag: "food",
    width: 1000,
    height: 1000,
    focalX: 50,
    focalY: 66,
    sourceUrl: `${CDN}/restaurantina-pk6qlcxv-food2.jpg`,
  },
  {
    file: "food-3.jpg",
    alt: "Close-up of steak tacos with grilled green onions, radishes, lime and salsas on a clay plate, with clay jarritos and a Talavera bird in the background",
    caption: "Fresh tortillas, salsas and clay jarritos",
    tag: "food",
    width: 1000,
    height: 1000,
    focalX: 50,
    focalY: 64,
    sourceUrl: `${CDN}/restaurantina-tq4hr39f-food3.jpg`,
  },
  {
    file: "logo.png",
    alt: "RestauranTina logo: a smiling abuela with glasses and curly hair inside an arched window above the RestauranTina wordmark",
    tag: "brand",
    width: 500,
    height: 500,
    inGallery: false,
    sourceUrl: `${CDN}/restaurantina-8h2jzfpc-logo.png`,
  },
];

/** `media` table rows for MEDIA. */
export function mediaSeedRows() {
  return MEDIA.map((m, i) => ({
    file: `/images/${m.file}`,
    alt: m.alt,
    caption: m.caption ?? null,
    tag: m.tag,
    width: m.width,
    height: m.height,
    focalX: m.focalX ?? 50,
    focalY: m.focalY ?? 50,
    featured: m.featured ?? false,
    inGallery: m.inGallery ?? true,
    displayOrder: i,
    sourceUrl: m.sourceUrl ?? null,
  }));
}

/** No modifier groups are described in the source; staff can add them under Admin → Menu → Modifiers. */
export const MODIFIER_GROUPS: import("./types").SeedModifierGroup[] = [];

// keep the price helper exported for tests that compare against the source
export { $ };
