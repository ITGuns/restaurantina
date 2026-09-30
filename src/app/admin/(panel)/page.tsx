import Link from "next/link";
import { Btn, Card, EmptyState, Stat, StatusBadge } from "@/components/admin/ui";
import { getClock, hoursFor, storeStatus } from "@/lib/availability";
import { flattenItems, readMenuTree } from "@/lib/data/menu";
import { dashboardStats } from "@/lib/data/reservations";
import { readBookingSettings, readHours, readRestaurant } from "@/lib/data/restaurant";
import { readDateOverrides } from "@/lib/data/booking";
import { longDate, money, shortDate, time12 } from "@/lib/format";

export default async function DashboardPage() {
  const settings = await readBookingSettings();
  const clock = getClock(settings.timezone);
  const [hours, stats, tree, overrides, restaurant] = await Promise.all([readHours(), dashboardStats(clock.date), readMenuTree(true), readDateOverrides(clock.date), readRestaurant()]);
  const status = storeStatus(hours, clock);
  const items = flattenItems(tree);
  const activeItems = items.filter((i) => i.active);
  const featured = items.filter((i) => i.featured && i.active).slice(0, 8);
  const popular = items.filter((i) => i.popular && i.active);
  const todayRow = hoursFor(hours, "store", clock.dayOfWeek);
  const upcomingOverrides = overrides.slice(0, 4);
  const todo = [
    !restaurant.phoneConfirmed && { href: "/admin/settings#contact", label: "Confirm which phone number to feature (the source lists two)." },
    !restaurant.hoursConfirmed && { href: "/admin/hours", label: "Confirm the opening hours (website, Google and social posts disagree)." },
    !restaurant.story && { href: "/admin/settings#story", label: "Write the About Tina story." },
    !restaurant.email && { href: "/admin/settings#contact", label: "Add a contact email address." },
  ].filter((t): t is { href: string; label: string } => Boolean(t));

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-500">{longDate(clock.date, { weekday: true, year: true })}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Today at a glance</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/menu?new=1"><Btn variant="primary">+ Add Menu Item</Btn></Link>
          <Link href="/admin/reservations"><Btn>View Reservations</Btn></Link>
          <Link href="/admin/hours"><Btn>Edit Hours</Btn></Link>
        </div>
      </div>

      {todo.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-amber-900">Needs your confirmation</p>
          <ul className="mt-1 space-y-0.5 text-[13px] text-amber-800">
            {todo.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="hover:underline">→ {t.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Reservations today" value={stats.today.total} hint={`${stats.today.covers} expected guests`} />
        <Stat label="Expected guests" value={stats.today.covers} tone="good" hint="Pending + confirmed" />
        <Stat label="Pending" value={stats.today.pending} tone={stats.today.pending ? "warn" : "default"} hint={stats.pendingCount ? `${stats.pendingCount} pending upcoming` : undefined} />
        <Stat label="Confirmed today" value={stats.today.confirmed} />
        <Stat label="Upcoming (active)" value={stats.upcomingCount} hint={settings.bookingsEnabled ? "Online booking on" : "Online booking paused"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Today's reservations" description={`${stats.today.total} total`} className="xl:col-span-2" padded={false} actions={<Link href={`/admin/reservations?view=day&date=${clock.date}`} className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900">Day view →</Link>}>
          {stats.todayList.length === 0 ? (
            <div className="p-5"><EmptyState title="No reservations today" body="New bookings from the website will show up here." /></div>
          ) : (
            <table className="w-full text-[14px]">
              <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
                <tr><th className="px-5 py-2 font-medium">Time</th><th className="px-3 py-2 font-medium">Guest</th><th className="px-3 py-2 font-medium">Party</th><th className="px-3 py-2 font-medium">Status</th><th className="px-5 py-2 font-medium">Phone</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.todayList.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-2.5 font-medium tabular-nums text-zinc-900">{time12(r.time)}</td>
                    <td className="px-3 py-2.5"><Link href={`/admin/reservations/${r.id}`} className="font-medium text-zinc-900 hover:underline">{r.firstName} {r.lastName}</Link><span className="ml-2 text-[12px] text-zinc-400">{r.confirmationCode}</span></td>
                    <td className="px-3 py-2.5 tabular-nums">{r.partySize}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-2.5 text-zinc-600">{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Today's hours" description={`${status.label} · ${status.detail}`}>
            <p className="text-[15px] font-medium tabular-nums text-zinc-900">
              {!todayRow || todayRow.isClosed ? "Closed today" : `${time12(todayRow.opensAt, { compact: true })} – ${time12(todayRow.closesAt, { compact: true })}`}
            </p>
            {!restaurant.hoursConfirmed && <p className="mt-2 text-[12px] text-amber-700">Seeded from the old website; not yet confirmed.</p>}
            {upcomingOverrides.length > 0 && (
              <div className="mt-3 border-t border-zinc-100 pt-3 text-[13px]">
                <p className="text-zinc-500">Upcoming date overrides</p>
                <ul className="mt-1 space-y-0.5 text-zinc-700">
                  {upcomingOverrides.map((o) => (
                    <li key={o.id}>{shortDate(o.date)} · {o.closed ? "Closed" : `${time12(o.startTime!)} – ${time12(o.endTime!)}`}{o.isHoliday ? " · holiday" : ""}{o.reason ? ` · ${o.reason}` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            <Link href="/admin/hours" className="mt-3 inline-block text-[13px] font-medium text-zinc-600 hover:text-zinc-900">Edit hours →</Link>
          </Card>

          <Card title="Menu" description="Live on the website">
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-zinc-500">Items</dt><dd className="text-xl font-semibold text-zinc-900">{items.length}</dd></div>
              <div><dt className="text-zinc-500">Active / hidden</dt><dd className="text-xl font-semibold text-zinc-900">{activeItems.length} <span className="text-[13px] font-normal text-zinc-400">/ {items.length - activeItems.length}</span></dd></div>
              <div><dt className="text-zinc-500">Categories</dt><dd className="text-xl font-semibold text-zinc-900">{tree.categories.length}</dd></div>
              <div><dt className="text-zinc-500">Featured / popular</dt><dd className="text-xl font-semibold text-zinc-900">{featured.length} <span className="text-[13px] font-normal text-zinc-400">/ {popular.length}</span></dd></div>
            </dl>
            <Link href="/admin/menu" className="mt-3 inline-block text-[13px] font-medium text-zinc-600 hover:text-zinc-900">Manage menu →</Link>
          </Card>

          <Card title="Upcoming" description="Next active reservations" padded={false}>
            {stats.upcoming.length === 0 ? (
              <div className="p-5"><EmptyState title="Nothing upcoming" /></div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {stats.upcoming.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                    <div className="min-w-0">
                      <Link href={`/admin/reservations/${r.id}`} className="block truncate font-medium text-zinc-900 hover:underline">{r.firstName} {r.lastName} · {r.partySize}</Link>
                      <p className="text-zinc-500">{shortDate(r.date)} · {time12(r.time)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Popular & featured items" description="Shown in the homepage showcases" className="mt-6" padded={false} actions={<Link href="/admin/menu?featured=1" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900">Manage →</Link>}>
        {featured.length === 0 ? (
          <div className="p-5"><EmptyState title="No featured items" body="Mark items as featured from the menu editor." /></div>
        ) : (
          <ul className="grid gap-px bg-zinc-100 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((i) => (
              <li key={i.id} className="flex items-center gap-3 bg-white px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-900 font-serif text-[15px] italic text-amber-200">
                  {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : i.name[0]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-zinc-900">{i.name}</span>
                  <span className="block text-[12px] text-zinc-500">{i.categoryName} · {i.price == null ? (i.priceNote ?? "no price") : money(i.price)}{i.popular ? " · popular" : ""}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
