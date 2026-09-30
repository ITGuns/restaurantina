/**
 * Reference data copied from restaurantina-data.md for the admin "resolve conflicts" tools.
 * The public site never reads this file: it shows whatever is stored in the database.
 */

export type SourceHoursRow = { dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean };

const row = (dayOfWeek: number, opensAt: string | null, closesAt: string | null): SourceHoursRow => ({ dayOfWeek, opensAt, closesAt, isClosed: !opensAt });
const MON_SAT = [1, 2, 3, 4, 5, 6];

/** Section 3 of the source: three sets of hours that disagree with each other. */
export const SOURCE_HOURS: { key: string; label: string; description: string; rows: SourceHoursRow[] }[] = [
  {
    key: "website",
    label: "Old website",
    description: "restaurantinatx.com homepage",
    rows: [...MON_SAT.map((d) => row(d, "09:00", "19:00")), row(0, "09:00", "17:00")],
  },
  {
    key: "google",
    label: "Google Business Profile",
    description: "Listing on Google Maps (closed Mondays)",
    rows: [row(1, null, null), ...[2, 3, 4, 5, 6].map((d) => row(d, "09:00", "17:00")), row(0, "09:00", "15:00")],
  },
  {
    key: "social",
    label: "Social posts",
    description: "Instagram / Facebook / TikTok posts",
    rows: [...MON_SAT.map((d) => row(d, "09:00", "19:00")), row(0, "09:00", "15:00")],
  },
];

/** Section 2 of the source: where each phone number appears. */
export const SOURCE_PHONES = [
  { number: "(915) 259-8774", seenOn: ["Google Business Profile", "Facebook", "TikTok", "online ordering page"] },
  { number: "(915) 268-1543", seenOn: ["old website homepage"] },
];

/** Section 9 of the source: what still needs the owner's answer. */
export const SOURCE_OPEN_QUESTIONS = [
  "Which hours are correct? Three sources disagree.",
  "Which phone number to feature: 259-8774 or 268-1543?",
  "English translations alongside the Spanish menu names?",
  "Keep FOX Ordering for online orders, or switch platforms?",
  "An email address for the contact section?",
  "The story / About Tina copy: who is Tina, when did they open, family background?",
];
