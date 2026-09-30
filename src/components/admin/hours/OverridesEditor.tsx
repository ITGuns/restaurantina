"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDateOverride, saveDateOverride } from "@/actions/hours";
import type { DateOverride } from "@/db/schema";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Field, Input, Segmented, Tag, Toggle } from "@/components/admin/ui";
import { longDate, time12 } from "@/lib/format";

type Mode = "closed" | "special" | "regular";

export function OverridesEditor({ overrides }: { overrides: DateOverride[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<DateOverride | null | "new">(null);
  const [deleting, setDeleting] = useState<DateOverride | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await deleteDateOverride(deleting.id);
    setBusy(false);
    setDeleting(null);
    if (res.ok) {
      toast.success("Override removed");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <Card title="Holidays, closures & special hours" description="Close reservations on a date, open a one-off window, or flag a holiday so the weekend holiday label applies." padded={false} actions={<Btn size="sm" variant="primary" onClick={() => setEditing("new")}>+ Add date</Btn>}>
      {overrides.length === 0 ? (
        <div className="p-5"><EmptyState title="No upcoming date overrides" body="Regular weekly hours apply to every date." /></div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {overrides.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[14px]">
              <span className="w-44 font-medium text-zinc-900">{longDate(o.date, { weekday: true, year: true })}</span>
              {o.closed ? <Tag tone="red">Closed</Tag> : o.startTime && o.endTime ? <Tag tone="green">Special hours · {time12(o.startTime)} – {time12(o.endTime)}</Tag> : <Tag tone="blue">Regular hours</Tag>}
              {o.isHoliday && <Tag tone="amber">Holiday</Tag>}
              <span className="flex-1 truncate text-zinc-500">{o.reason}</span>
              <Btn size="sm" onClick={() => setEditing(o)}>Edit</Btn>
              <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleting(o)}>Remove</Btn>
            </li>
          ))}
        </ul>
      )}
      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a date override" : "Edit date override"} width="max-w-md">
        {editing !== null && <OverrideForm key={editing === "new" ? "new" : editing.id} o={editing === "new" ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />}
      </Drawer>
      <ConfirmDialog open={!!deleting} title="Remove this override?" body="The regular weekly schedule will apply to this date again." confirmLabel="Remove" loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </Card>
  );
}

function OverrideForm({ o, onDone }: { o: DateOverride | null; onDone: () => void }) {
  const toast = useToast();
  const initialMode: Mode = !o ? "closed" : o.closed ? "closed" : o.startTime ? "special" : "regular";
  const [f, setF] = useState({ date: o?.date ?? "", mode: initialMode, startTime: o?.startTime ?? "11:00", endTime: o?.endTime ?? "21:00", isHoliday: o?.isHoliday ?? false, reason: o?.reason ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveDateOverride({
      id: o?.id,
      date: f.date,
      closed: f.mode === "closed",
      startTime: f.mode === "special" ? f.startTime : "",
      endTime: f.mode === "special" ? f.endTime : "",
      isHoliday: f.isHoliday,
      reason: f.reason,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Date saved");
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Date" htmlFor="o-date" error={errors.date} required><Input id="o-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
      <Field label="Reservations on this date">
        <Segmented value={f.mode} onChange={(v) => setF({ ...f, mode: v })} options={[{ value: "closed", label: "Closed" }, { value: "special", label: "Special hours" }, { value: "regular", label: "Regular hours" }]} />
      </Field>
      {f.mode === "special" && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="First seating" htmlFor="o-start" error={errors.startTime} required><Input id="o-start" type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></Field>
          <Field label="Last seating" htmlFor="o-end" error={errors.endTime} required><Input id="o-end" type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} /></Field>
        </div>
      )}
      <Toggle checked={f.isHoliday} onChange={(v) => setF({ ...f, isHoliday: v })} label="Holiday" description="Label this date as a holiday (shown on the dashboard and to guests)" />
      <Field label="Reason" htmlFor="o-reason" hint="Shown to guests when they pick this date"><Input id="o-reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Thanksgiving, private event…" /></Field>
      <div className="flex justify-end gap-2 pt-2"><Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn><Btn type="submit" variant="primary" loading={busy}>Save</Btn></div>
    </form>
  );
}
