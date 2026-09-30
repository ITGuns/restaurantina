# RestauranTina — website, reservations & menu CMS

Production-grade restaurant platform for **RestauranTina** (Authentic Mexican Cuisine · 12115 Montwood Dr Ste 201B, El Paso, TX 79936): a cinematic, Talavera-inspired public site, a real table-reservation system with server-side availability, and a staff control panel for the menu, photos, hours, reservations and every restaurant setting.

Every fact on the site comes from `restaurantina-data.md` (the primary source of truth scraped from the old website, Instagram, Facebook, TikTok and Google Business Profile): name, tagline, description, address, coordinates, both phone numbers, social links, ordering link, rating, review themes, slogans, menu notes, all 11 categories and 82 menu items with exact Spanish names, descriptions and prices, the logo and the three food photos. Nothing is invented. Everything the source leaves open (which hours are right, which phone to feature, the About Tina story, an email address, English translations) is editable in the admin and flagged there until the owner resolves it.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Actions), TypeScript |
| Styling | Tailwind CSS v4 with the source palette (logo brown `#3D2B1F`, cream `#F5EFE6`, terracotta `#B5451B`, Talavera green `#2E5E4E`, Talavera blue `#1F3A93`, mustard `#D9A21B`) · Fraunces (display) + Figtree (body) via `next/font` |
| Motion | `motion` (Framer Motion 12): hero reveal + steam + floating Talavera tiles, split-text headlines, scroll reveals, parallax, drag carousel, rotating Sabores plate, animated menu category switches, lightbox, drag-and-drop admin ordering; `MotionConfig reducedMotion="user"` honours reduced motion everywhere |
| Database | Postgres via Drizzle ORM (`pg`). Local dev uses a bundled Postgres cluster; production works with Supabase's pooler. Admin uploads are stored in a `bytea` table so deployments need no disk or bucket |
| Auth | Signed HttpOnly JWT session cookie (`jose`) with a per-user token version (sign-out and password changes revoke every earlier token), scrypt password hashes, middleware-protected `/admin`, server-side `requireAdmin()` on every mutation |
| Validation | Zod on every server action; typed field errors returned to forms; rate limiting on login, slot lookups and booking |
| Headers | Content-Security-Policy, Permissions-Policy, X-Frame-Options, nosniff; `X-Powered-By` disabled |

## Quick start

```bash
npm install
cp .env.example .env.local        # DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:local init             # starts a local Postgres on :5434 and creates the `restaurantina` database
npm run db:push                   # creates the schema
npm run db:seed                   # imports the full menu, hours, booking defaults, photos + admin user
npm run dev                       # http://localhost:3200  ·  admin at /admin
```

`npm run db:local start|stop|status|psql` manages the local cluster (data lives in `data/pg`, git-ignored). `npm run db:reseed` wipes and re-seeds content tables without deleting reservations; `npm run db:reset` also clears reservations and date overrides. `npm run assets:fetch` re-downloads the logo and photos into `public/images` if they are missing.

## Deployment

Any Node host that runs Next.js works; `vercel.json` is included. Required env vars: `DATABASE_URL` (on Supabase use the **transaction pooler**, port 6543), `SESSION_SECRET`, and optionally `NEXT_PUBLIC_SITE_URL`. `DIRECT_URL` (session pooler, port 5432) is only needed for `drizzle-kit push` and the seed. SSL is enabled automatically for non-localhost hosts.

## What's inside

**Public**
- `/` — arched hero built around the real logo and food photography (Talavera ring, floating tiles, steam, light sweep, parallax), slogan ticker, concept intro with rating / price range, featured dishes (editorial photo + typographic list), **Sabores de Tina** (interactive dish selector on a rotating Talavera plate), drag/swipe food carousel, full-bleed cinematic photo with overlapping type, bento grid mixing photos and menu-note tiles, "Our story" (owner-editable; shows the verified concept until written), Desayunos showcase, Made-from-scratch storytelling, café & desserts, review themes + 4.7★ / 72 reviews (no fabricated quotes), visit section with a map at the source coordinates, booking band, Follow Tina social section, rich footer with Privacy/Terms links.
- `/menu` — all 11 categories and 82 items, sticky category tabs (swipeable on mobile), accent-insensitive search across Spanish/English names and descriptions, Popular / Featured / Available-now / dietary filters, animated category transitions, item drawer with optional photo and English translation, deep links (`?category=`, `?item=`, `?q=`), source menu notes.
- `/book` — 5-step wizard (date → guests → time → details → review) → stored reservation → **RESERVATION CONFIRMED** screen with `RT-xxxxx` code, Add to Calendar (Google + .ics), View Reservation (private manage link with cancel) and Back to Home. The confirmation only renders after the row exists.
- `/gallery` — strip, filterable masonry and an accessible lightbox (Esc, arrow keys, swipe, focus trap, scroll lock). `/visit`, `/privacy`, `/terms`.
- Sticky Reserve/Menu/Call bar on phones, hamburger navigation with inert background, skip link, JSON-LD `Restaurant` markup (geo, hours, rating, ReserveAction), sitemap, robots, canonical + Open Graph per page, AVIF/WebP responsive images.

**Admin** (`/admin`, login required)
- Dashboard: today's reservations, expected guests, pending, confirmed, upcoming, today's hours, menu counts, popular/featured items, quick actions, and a "Needs your confirmation" checklist for the open source questions.
- Reservations: list / calendar / day views, search and filters, detail page, confirm / complete / no-show / cancel / edit / delete, staff-created bookings, copyable guest link.
- Menu: per-category table with drag ordering, inline price edit, star/hide/duplicate/edit/delete, global search; full editor (name, Spanish name, English name, descriptions in both languages, price + note, photo from the library or upload, alt text, dietary tags, availability windows, modifier groups, featured, popular, active). Categories (bilingual names/notes, drag ordering) and reusable modifier groups.
- Media: grid/list library with filters (All / Food / Menu / Gallery / Hero / …), validated uploads (type, size, real pixel dimensions), replace, alt text, caption, focal point, featured, gallery visibility, ordering, delete, and one-click assignment to a menu item, the hero or the share image.
- Hours: regular hours, the **three conflicting hour sets from the source side by side** with one-click apply, weekly reservation windows, holidays / closures / special hours, and a "rebuild reservation windows from hours" helper.
- Settings: contact & location with the **phone-number resolver** (both source numbers, choose which to feature, mark confirmed), restaurant info + review themes + slogans + menu notes, hero copy & story, social & ordering links (Order Online button toggle), SEO, privacy/terms text, booking rules (interval, turn time, party limits, capacity per slot, lead time, days in advance, auto-confirm, occasions), password.

## Availability & booking engine

`src/lib/booking.ts` computes reservation slots from the weekly windows + date overrides + booking settings and re-checks availability inside a per-date advisory-locked transaction, so two guests can't take the last seat. Bookings are idempotent per submission and de-duplicated per guest/date/time; past times, closed dates, over-capacity slots, invalid party sizes and missing customer details are all rejected server-side. El Paso is on Mountain Time (`America/Denver`).

## Testing & QA

```bash
npm run test:unit     # Vitest: booking engine, availability, validation, menu search, formatting, seed-vs-source integrity
npm run test:e2e      # Playwright: public flows (home, menu, booking, gallery, legal, axe a11y), mobile, admin (dashboard, menu CMS, reservations, hours/settings, media), data integrity vs the source
node scripts/qa/screens.mjs        # full-page screenshots at 1440 / 390 into data/qa-screens
node scripts/qa/breakpoints.mjs    # horizontal-overflow + page-error sweep at 320…1920px
```

The E2E suite reuses the dev server on :3200, warms every route, logs into the admin and exercises the real database. Records it creates are tagged `QA` / `@qa.restaurantina.test` and removed afterwards; settings it changes are restored.

## Source-of-truth notes

- Hours are seeded from the old website (Mon–Sat 9 AM–7 PM, Sun 9 AM–5 PM) and marked **not confirmed**; Google (closed Mondays, 9–5) and social posts (9–7, Sun 9–3) are shown in Admin → Hours for one-click apply.
- Both phone numbers are stored; `(915) 259-8774` (used on Google, Facebook, TikTok and the ordering page) is featured by default and flagged for confirmation in Admin → Settings.
- Menu names, descriptions and prices are verbatim; English translations are empty fields for the owner to fill. "Pan dulce" is part of the concept copy but is not a priced menu item in the source, so it is not seeded as one.
- Menu items ship without photos (the source only has three general food photos); they render as typographic tiles until staff assign or upload a photo. No stock or generated photography is used.
- The reservation rules are not from the source (the old site had no booking); the defaults are derived from the hours and fully editable.
