import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getClock, storeStatus, type Clock, type StoreStatus } from "./availability";
import { featuredPhone, getBookingSettings, getHours, getRestaurant } from "./data/restaurant";
import { phoneHref } from "./format";
import type { Hours, RestaurantInfo } from "@/db/schema";

export type SiteChrome = {
  restaurant: RestaurantInfo;
  hours: Hours[];
  clock: Clock;
  status: StoreStatus;
  /** The featured phone number, formatted, and its tel: link */
  phone: string;
  phoneHref: string;
  /** Today is flagged as a holiday under Hours → date overrides */
  todayIsHoliday: boolean;
};

export async function getSiteChrome(): Promise<SiteChrome> {
  const [restaurant, hours, settings] = await Promise.all([getRestaurant(), getHours(), getBookingSettings()]);
  const clock = getClock(settings.timezone);
  const [override] = await db
    .select({ isHoliday: schema.dateOverrides.isHoliday })
    .from(schema.dateOverrides)
    .where(eq(schema.dateOverrides.date, clock.date))
    .limit(1);
  const phone = featuredPhone(restaurant);
  return { restaurant, hours, clock, status: storeStatus(hours, clock), phone, phoneHref: phoneHref(phone), todayIsHoliday: Boolean(override?.isHoliday) };
}

export function fullAddress(r: Pick<RestaurantInfo, "addressLine1" | "addressLine2" | "city" | "state" | "zip">): string {
  return [r.addressLine1, r.addressLine2, `${r.city}, ${r.state} ${r.zip}`].filter(Boolean).join(", ");
}

/** Link to the listing on Google Maps (place link when known, else the coordinates). */
export function mapsUrl(r: RestaurantInfo): string {
  if (r.googleMapsUrl) return r.googleMapsUrl;
  if (r.latitude != null && r.longitude != null) return `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`;
  const q = encodeURIComponent(`${r.name}, ${fullAddress(r)}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Turn-by-turn directions to the exact coordinates from the source. */
export function directionsUrl(r: RestaurantInfo): string {
  const dest = r.latitude != null && r.longitude != null ? `${r.latitude},${r.longitude}` : encodeURIComponent(fullAddress(r));
  const place = r.googlePlaceId ? `&destination_place_id=${r.googlePlaceId}` : "";
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${place}`;
}

export function mapsEmbedUrl(r: RestaurantInfo): string {
  if (r.latitude != null && r.longitude != null) {
    return `https://maps.google.com/maps?q=${r.latitude},${r.longitude}&z=16&output=embed`;
  }
  const q = encodeURIComponent(`${r.name}, ${fullAddress(r)}`);
  return `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
}
