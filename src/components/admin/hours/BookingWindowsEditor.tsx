"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteBookingWindow, saveBookingWindow } from "@/actions/hours";
import type { BookingWindow } from "@/db/schema";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Field, Input, Select, Tag, Toggle } from "@/components/admin/ui";
import { DAY_NAMES } from "@/lib/constants";
import { time12 } from "@/lib/format";
import { cn } from "@/lib/cn";

export function BookingWindowsEditor({ windows, slotInterval }: { windows: BookingWindow[]; slotInterval: number }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<BookingWindow | null | "new">(null);
  const [deleting, setDeleting] = useState<BookingWindow | null>(null);
  const [busy, setBusy] = useState(false);
  const byDay = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: d, list: windows.filter((w) => w.dayOfWeek === d) }));

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await deleteBookingWindow(deleting.id);
    setBusy(false);
    setDeleting(null);
    if (res.ok) {
      toast.success("Window removed");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <Card title="Reservation windows" description={`Weekly first/last seating times. Slots are generated every ${slotInterval} minutes between them. Days with no window are closed for online booking.`} padded={false} actions={<Btn size="sm" variant="primary" onClick={() => setEditing("new")}>+ Add window</Btn>}>
      {windows.length === 0 ? (
        <div className="p-5"><EmptyState title="No reservation windows" body="Online booking is effectively closed until you add one." /></div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {byDay.map(({ day, list }) => (
            <li key={day} className="flex items-start gap-4 px-4 py-2.5">
              <span className="w-24 pt-1 text-[14px] font-medium text-zinc-900">{DAY_NAMES[day]}</span>
              <div className="flex flex-1 flex-wrap gap-2">
                {list.length === 0 && <span className="pt-1 text-[13px] text-zinc-400">Closed</span>}
                {list.map((w) => (
                  <button key={w.id} type="button" onClick={() => setEditing(w)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition hover:border-zinc-500", w.active ? "border-zinc-200 bg-white" : "border-dashed border-zinc-300 text-zinc-400")}>
                    <span className="font-medium tabular-nums">{time12(w.startTime)} – {time12(w.endTime)}</span>
                    {w.label && <span className="text-zinc-500">{w.label}</span>}
                    {!w.active && <Tag tone="gray">Off</Tag>}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New reservation window" : "Edit reservation window"} width="max-w-md">
        {editing !== null && <WindowForm key={editing === "new" ? "new" : editing.id} w={editing === "new" ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} onDelete={() => { const w = editing as BookingWindow; setEditing(null); setDeleting(w); }} />}
      </Drawer>
      <ConfirmDialog open={!!deleting} title="Remove this window?" body={deleting ? `${DAY_NAMES[deleting.dayOfWeek]} ${time12(deleting.startTime)} – ${time12(deleting.endTime)} will no longer accept online reservations.` : ""} confirmLabel="Remove" loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </Card>
  );
}

function WindowForm({ w, onDone, onDelete }: { w: BookingWindow | null; onDone: () => void; onDelete: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ dayOfWeek: String(w?.dayOfWeek ?? 5), startTime: w?.startTime ?? "17:00", endTime: w?.endTime ?? "20:00", label: w?.label ?? "", active: w?.active ?? true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveBookingWindow({ ...f, id: w?.id });
    setBusy(false);
    if (res.ok) {
      toast.success("Window saved");
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Day" htmlFor="w-day"><Select id="w-day" value={f.dayOfWeek} onChange={(e) => setF({ ...f, dayOfWeek: e.target.value })}>{[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}</Select></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First seating" htmlFor="w-start" error={errors.startTime} required><Input id="w-start" type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} required /></Field>
        <Field label="Last seating" htmlFor="w-end" error={errors.endTime} required><Input id="w-end" type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} required /></Field>
      </div>
      <Field label="Label" htmlFor="w-label" hint='e.g. "Lunch & Dinner", "Sunday Brunch"'><Input id="w-label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
      <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" />
      <div className="flex items-center justify-between pt-2">
        <div>{w && <Btn type="button" variant="ghost" className="text-red-600" onClick={onDelete}>Remove</Btn>}</div>
        <div className="flex gap-2"><Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn><Btn type="submit" variant="primary" loading={busy}>Save</Btn></div>
      </div>
    </form>
  );
}
