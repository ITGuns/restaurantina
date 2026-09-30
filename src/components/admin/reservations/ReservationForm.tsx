"use client";

import { useState } from "react";
import { saveReservation } from "@/actions/reservations";
import type { Reservation, ReservationStatus } from "@/db/schema";
import { RESERVATION_STATUSES } from "@/db/schema";
import { Btn, Field, Input, Select, Textarea } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants";

type FormState = { date: string; time: string; partySize: string; firstName: string; lastName: string; email: string; phone: string; occasion: string; specialRequests: string; internalNotes: string; status: ReservationStatus };

export function ReservationForm({ initial, defaultDate, occasions, onSaved, onCancel }: { initial?: Reservation; defaultDate: string; occasions: string[]; onSaved: (r: Reservation) => void; onCancel: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<FormState>({
    date: initial?.date ?? defaultDate,
    time: initial?.time ?? "12:00",
    partySize: String(initial?.partySize ?? 2),
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    occasion: initial?.occasion ?? "",
    specialRequests: initial?.specialRequests ?? "",
    internalNotes: initial?.internalNotes ?? "",
    status: initial?.status ?? "confirmed",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const res = await saveReservation({ ...f, id: initial?.id });
    setBusy(false);
    if (res.ok) {
      toast.success(initial ? "Reservation updated" : "Reservation created", `${res.data.firstName} ${res.data.lastName} · ${res.data.confirmationCode}`);
      onSaved(res.data);
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit} id="reservation-form" className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date" htmlFor="r-date" error={errors.date} required><Input id="r-date" type="date" value={f.date} onChange={set("date")} error={!!errors.date} required /></Field>
        <Field label="Time" htmlFor="r-time" error={errors.time} required><Input id="r-time" type="time" step={900} value={f.time} onChange={set("time")} error={!!errors.time} required /></Field>
        <Field label="Party size" htmlFor="r-party" error={errors.partySize} required><Input id="r-party" type="number" min={1} max={100} value={f.partySize} onChange={set("partySize")} error={!!errors.partySize} required /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="r-first" error={errors.firstName} required><Input id="r-first" value={f.firstName} onChange={set("firstName")} error={!!errors.firstName} required /></Field>
        <Field label="Last name" htmlFor="r-last" error={errors.lastName} required><Input id="r-last" value={f.lastName} onChange={set("lastName")} error={!!errors.lastName} required /></Field>
        <Field label="Email" htmlFor="r-email" error={errors.email} required><Input id="r-email" type="email" value={f.email} onChange={set("email")} error={!!errors.email} required /></Field>
        <Field label="Phone" htmlFor="r-phone" error={errors.phone} required><Input id="r-phone" type="tel" value={f.phone} onChange={set("phone")} error={!!errors.phone} required /></Field>
        <Field label="Occasion" htmlFor="r-occ">
          {occasions.length ? (
            <Select id="r-occ" value={f.occasion} onChange={set("occasion")}><option value="">None</option>{occasions.map((s) => <option key={s}>{s}</option>)}{f.occasion && !occasions.includes(f.occasion) && <option>{f.occasion}</option>}</Select>
          ) : (
            <Input id="r-occ" value={f.occasion} onChange={set("occasion")} />
          )}
        </Field>
        <Field label="Status" htmlFor="r-status"><Select id="r-status" value={f.status} onChange={set("status")}>{RESERVATION_STATUSES.map((s) => <option key={s} value={s}>{RESERVATION_STATUS_LABELS[s]}</option>)}</Select></Field>
      </div>
      <Field label="Special requests (from guest)" htmlFor="r-req" error={errors.specialRequests}><Textarea id="r-req" value={f.specialRequests} onChange={set("specialRequests")} /></Field>
      <Field label="Internal notes (staff only)" htmlFor="r-notes" error={errors.internalNotes}><Textarea id="r-notes" value={f.internalNotes} onChange={set("internalNotes")} placeholder="Table assignment, allergy flags, VIP…" /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Btn>
        <Btn type="submit" variant="primary" loading={busy}>{initial ? "Save changes" : "Create reservation"}</Btn>
      </div>
    </form>
  );
}
