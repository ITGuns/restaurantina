"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteReservation, updateReservationStatus } from "@/actions/reservations";
import type { Reservation, ReservationStatus } from "@/db/schema";
import { Drawer, ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Input, Segmented, Select, StatusBadge } from "@/components/admin/ui";
import { DAY_SHORT, RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { addDays, longDate, parseDate, shortDate, time12, toYmd, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ReservationForm } from "./ReservationForm";

type View = "list" | "calendar" | "day";
export type Filters = { view: View; date: string; month: string; status: string; q: string; from: string; to: string };

export function ReservationsView({ reservations, filters, today, monthCounts, occasions }: { reservations: Reservation[]; filters: Filters; today: string; monthCounts: Record<string, { total: number; covers: number }>; occasions: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Reservation | null | "new">(null);
  const [deleting, setDeleting] = useState<Reservation | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [q, setQ] = useState(filters.q);

  // Merge onto the live URL (not the props) so quick successive filter changes never clobber each other.
  const push = (next: Partial<Filters>) => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has("view")) p.set("view", filters.view);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    start(() => router.push(`/admin/reservations?${p.toString()}`));
  };

  const setStatus = async (r: Reservation, status: ReservationStatus) => {
    setBusyId(r.id);
    const res = await updateReservationStatus(r.id, status);
    setBusyId(null);
    if (res.ok) {
      toast.success(`Marked ${RESERVATION_STATUS_LABELS[status].toLowerCase()}`, `${r.firstName} ${r.lastName} · ${r.confirmationCode}`);
      router.refresh();
    } else toast.error(res.error);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    const res = await deleteReservation(deleting.id);
    setBusyId(null);
    setDeleting(null);
    if (res.ok) {
      toast.success("Reservation deleted");
      router.refresh();
    } else toast.error(res.error);
  };

  const actions = (r: Reservation) => {
    const busy = busyId === r.id;
    return (
      <div className="flex flex-wrap items-center gap-1">
        {r.status === "pending" && <Btn size="sm" variant="primary" onClick={() => setStatus(r, "confirmed")} loading={busy}>Confirm</Btn>}
        {(r.status === "pending" || r.status === "confirmed") && <Btn size="sm" onClick={() => setStatus(r, "completed")} disabled={busy}>Complete</Btn>}
        {(r.status === "pending" || r.status === "confirmed") && <Btn size="sm" onClick={() => setStatus(r, "no_show")} disabled={busy}>No-show</Btn>}
        {(r.status === "pending" || r.status === "confirmed") && <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setStatus(r, "cancelled")} disabled={busy}>Cancel</Btn>}
        {r.status === "cancelled" && <Btn size="sm" onClick={() => setStatus(r, "confirmed")} disabled={busy}>Reinstate</Btn>}
        <Btn size="sm" variant="ghost" onClick={() => setEditing(r)}>Edit</Btn>
        <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleting(r)}>Delete</Btn>
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented value={filters.view} onChange={(v) => push({ view: v })} options={[{ value: "list", label: "List" }, { value: "calendar", label: "Calendar" }, { value: "day", label: "Day" }]} />
        <div className="flex flex-wrap items-center gap-2">
          {filters.view === "list" && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); push({ q }); }} className="flex gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, code" className="w-64" />
                <Btn type="submit">Search</Btn>
              </form>
              <Select value={filters.status} onChange={(e) => push({ status: e.target.value })} className="w-40" aria-label="Status filter">
                <option value="active">Active</option>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No-show</option>
              </Select>
              <Input type="date" value={filters.from} onChange={(e) => push({ from: e.target.value })} className="w-40" aria-label="From date" />
              <Input type="date" value={filters.to} onChange={(e) => push({ to: e.target.value })} className="w-40" aria-label="To date" />
            </>
          )}
          <Btn variant="primary" onClick={() => setEditing("new")}>+ New reservation</Btn>
        </div>
      </div>

      <div className={cn(pending && "opacity-60 transition-opacity")}>
        {filters.view === "list" && (
          <Card padded={false}>
            {reservations.length === 0 ? (
              <div className="p-6"><EmptyState title="No reservations match" body="Try widening the date range or status filter." action={<Btn onClick={() => push({ q: "", status: "active", from: today, to: "" })}>Reset filters</Btn>} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-[14px]">
                  <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Guest</th>
                      <th className="px-3 py-2.5 font-medium">Party</th>
                      <th className="px-3 py-2.5 font-medium">Date</th>
                      <th className="px-3 py-2.5 font-medium">Time</th>
                      <th className="px-3 py-2.5 font-medium">Phone</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {reservations.map((r) => (
                      <tr key={r.id} className="align-top hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <Link href={`/admin/reservations/${r.id}`} className="font-medium text-zinc-900 hover:underline">{r.firstName} {r.lastName}</Link>
                          <p className="text-[12px] text-zinc-500">{r.email} · <span className="font-mono">{r.confirmationCode}</span>{r.source === "admin" && " · staff"}</p>
                          {(r.specialRequests || r.occasion) && <p className="mt-1 max-w-xs text-[12px] text-zinc-600">{[r.occasion, r.specialRequests].filter(Boolean).join(" · ")}</p>}
                          {r.internalNotes && <p className="mt-1 max-w-xs rounded bg-amber-50 px-1.5 py-0.5 text-[12px] text-amber-800">{r.internalNotes}</p>}
                        </td>
                        <td className="px-3 py-3 tabular-nums">{r.partySize}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{shortDate(r.date)}</td>
                        <td className="px-3 py-3 whitespace-nowrap tabular-nums">{time12(r.time)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-zinc-700">{r.phone}</td>
                        <td className="px-3 py-3"><StatusBadge status={r.status} /><p className="mt-1 text-[11px] text-zinc-400">{formatRelative(r.createdAt)}</p></td>
                        <td className="px-4 py-3">{actions(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {filters.view === "calendar" && <MonthCalendar month={filters.month} counts={monthCounts} today={today} onPick={(d) => push({ view: "day", date: d })} onMonth={(m) => push({ month: m })} />}

        {filters.view === "day" && <DayView date={filters.date} reservations={reservations} onDate={(d) => push({ date: d })} actions={actions} onNew={() => setEditing("new")} />}
      </div>

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New reservation" : `Edit ${editing?.confirmationCode ?? ""}`} description={editing && editing !== "new" ? `Created ${formatRelative(editing.createdAt)} via ${editing.source}` : "Staff-entered reservations skip availability checks."}>
        {editing !== null && (
          <ReservationForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} defaultDate={filters.view === "day" ? filters.date : today} occasions={occasions} onSaved={() => { setEditing(null); router.refresh(); }} onCancel={() => setEditing(null)} />
        )}
      </Drawer>

      <ConfirmDialog open={!!deleting} title="Delete this reservation?" body={deleting ? `${deleting.firstName} ${deleting.lastName} · ${longDate(deleting.date)} at ${time12(deleting.time)}. This permanently removes the record. Use Cancel if you just want to release the table.` : ""} confirmLabel="Delete" loading={busyId === deleting?.id} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </>
  );
}

function MonthCalendar({ month, counts, today, onPick, onMonth }: { month: string; counts: Record<string, { total: number; covers: number }>; today: string; onPick: (d: string) => void; onMonth: (m: string) => void }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1, 12);
  const label = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toYmd(new Date(y, m - 1, i + 1, 12)))];
  while (cells.length % 7) cells.push(null);
  const shift = (d: number) => {
    const n = new Date(y, m - 1 + d, 1, 12);
    onMonth(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`);
  };
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <Btn size="sm" onClick={() => shift(-1)} aria-label="Previous month">←</Btn>
        <h2 className="text-[15px] font-semibold text-zinc-900">{label}</h2>
        <Btn size="sm" onClick={() => shift(1)} aria-label="Next month">→</Btn>
      </div>
      <div className="grid grid-cols-7 border-b border-zinc-100 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {DAY_SHORT.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-100">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="min-h-[84px] bg-zinc-50" />;
          const c = counts[d];
          const isToday = d === today;
          const past = d < today;
          return (
            <button key={d} type="button" onClick={() => onPick(d)} className={cn("flex min-h-[84px] flex-col items-start bg-white p-2 text-left transition hover:bg-zinc-50", past && "text-zinc-400")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium", isToday && "bg-zinc-900 text-white")}>{Number(d.slice(-2))}</span>
              {c && <span className="mt-auto rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">{c.total} res · {c.covers} guests</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function DayView({ date, reservations, onDate, actions, onNew }: { date: string; reservations: Reservation[]; onDate: (d: string) => void; actions: (r: Reservation) => React.ReactNode; onNew: () => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach((r) => map.set(r.time, [...(map.get(r.time) ?? []), r]));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [reservations]);
  const active = reservations.filter((r) => r.status === "pending" || r.status === "confirmed");
  const covers = active.reduce((n, r) => n + r.partySize, 0);
  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Btn size="sm" onClick={() => onDate(addDays(date, -1))} aria-label="Previous day">←</Btn>
          <Input type="date" value={date} onChange={(e) => onDate(e.target.value)} className="w-40" aria-label="Day" />
          <Btn size="sm" onClick={() => onDate(addDays(date, 1))} aria-label="Next day">→</Btn>
        </div>
        <p className="text-[13px] text-zinc-600">
          <span className="font-semibold text-zinc-900">{longDate(date)}</span> · {active.length} active · {covers} guests · {reservations.length} total
        </p>
      </div>
      {groups.length === 0 ? (
        <div className="p-6"><EmptyState title={`No reservations on ${parseDate(date).toLocaleDateString("en-US", { weekday: "long" })}`} action={<Btn variant="primary" onClick={onNew}>+ Add reservation</Btn>} /></div>
      ) : (
        <ol className="divide-y divide-zinc-100">
          {groups.map(([time, list]) => (
            <li key={time} className="grid gap-3 px-4 py-4 md:grid-cols-[100px_1fr]">
              <div>
                <p className="text-[15px] font-semibold tabular-nums text-zinc-900">{time12(time)}</p>
                <p className="text-[12px] text-zinc-500">{list.reduce((n, r) => n + (r.status === "cancelled" || r.status === "no_show" ? 0 : r.partySize), 0)} guests</p>
              </div>
              <ul className="space-y-2">
                {list.map((r) => (
                  <li key={r.id} className={cn("flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between", r.status === "cancelled" || r.status === "no_show" ? "border-zinc-100 bg-zinc-50 opacity-70" : "border-zinc-200 bg-white")}>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-zinc-900">
                        {r.firstName} {r.lastName} <span className="rounded bg-zinc-100 px-1.5 text-[12px] tabular-nums">party of {r.partySize}</span> <StatusBadge status={r.status} />
                      </p>
                      <p className="text-[12px] text-zinc-500">{r.phone} · {r.email} · {r.confirmationCode}</p>
                      {(r.specialRequests || r.occasion) && <p className="mt-1 text-[12px] text-zinc-600">{[r.occasion, r.specialRequests].filter(Boolean).join(" · ")}</p>}
                    </div>
                    {actions(r)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function ReservationsHeaderLink() {
  return <Link href="/book" target="_blank" className="text-[13px] text-zinc-500 hover:text-zinc-900">Open public booking page ↗</Link>;
}
