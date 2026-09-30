"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveBookingSettings } from "@/actions/settings";
import type { BookingSettings } from "@/db/schema";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, Field, Input, Textarea, Toggle } from "@/components/admin/ui";

export function BookingSettingsForm({ settings: s }: { settings: BookingSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({
    slotIntervalMinutes: String(s.slotIntervalMinutes), turnTimeMinutes: String(s.turnTimeMinutes), minPartySize: String(s.minPartySize), maxPartySize: String(s.maxPartySize),
    largePartyThreshold: String(s.largePartyThreshold), maxBookingsPerSlot: String(s.maxBookingsPerSlot), maxCoversPerSlot: String(s.maxCoversPerSlot), minLeadTimeMinutes: String(s.minLeadTimeMinutes),
    maxDaysInAdvance: String(s.maxDaysInAdvance), autoConfirm: s.autoConfirm, bookingsEnabled: s.bookingsEnabled, occasions: s.occasions.join("\n"),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const num = (k: keyof typeof f) => ({ value: f[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }), error: !!errors[k], type: "number" as const });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveBookingSettings({ ...f, occasions: f.occasions.split("\n").map((x) => x.trim()).filter(Boolean) });
    setBusy(false);
    if (res.ok) {
      toast.success("Booking rules saved");
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit} id="booking">
      <Card title="Reservation rules" description="Capacity and pacing for online bookings. The source had no reservation rules, so these defaults are yours to tune. Reservation windows and blackout dates live under Hours." actions={<Btn type="submit" variant="primary" loading={busy}>Save rules</Btn>}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Toggle checked={f.bookingsEnabled} onChange={(v) => setF({ ...f, bookingsEnabled: v })} label="Online booking enabled" description="Turn off to pause the /book page" />
          <Toggle checked={f.autoConfirm} onChange={(v) => setF({ ...f, autoConfirm: v })} label="Auto-confirm" description="Otherwise every booking waits as Pending" />
          <div />
          <Field label="Reservation interval (min)" htmlFor="b-int" error={errors.slotIntervalMinutes}><Input id="b-int" min={5} max={120} {...num("slotIntervalMinutes")} /></Field>
          <Field label="Turn time (min)" htmlFor="b-turn" error={errors.turnTimeMinutes} hint="How long a table is occupied"><Input id="b-turn" min={15} max={360} {...num("turnTimeMinutes")} /></Field>
          <Field label="Minimum advance booking (min)" htmlFor="b-lead" error={errors.minLeadTimeMinutes} hint="Same-day bookings must be this far out"><Input id="b-lead" min={0} {...num("minLeadTimeMinutes")} /></Field>
          <Field label="Min party size" htmlFor="b-min" error={errors.minPartySize}><Input id="b-min" min={1} {...num("minPartySize")} /></Field>
          <Field label="Max party size (online)" htmlFor="b-max" error={errors.maxPartySize}><Input id="b-max" min={1} {...num("maxPartySize")} /></Field>
          <Field label="Large party threshold" htmlFor="b-large" error={errors.largePartyThreshold} hint="Parties this size or bigger are held as Pending"><Input id="b-large" min={1} {...num("largePartyThreshold")} /></Field>
          <Field label="Max bookings per slot" htmlFor="b-mb" error={errors.maxBookingsPerSlot} hint="Overlapping within the turn time"><Input id="b-mb" min={1} {...num("maxBookingsPerSlot")} /></Field>
          <Field label="Max guests per slot" htmlFor="b-mc" error={errors.maxCoversPerSlot}><Input id="b-mc" min={1} {...num("maxCoversPerSlot")} /></Field>
          <Field label="Maximum advance booking (days)" htmlFor="b-days" error={errors.maxDaysInAdvance}><Input id="b-days" min={1} max={365} {...num("maxDaysInAdvance")} /></Field>
          <Field label="Occasions (one per line)" htmlFor="b-occ" className="sm:col-span-2 lg:col-span-3"><Textarea id="b-occ" value={f.occasions} onChange={(e) => setF({ ...f, occasions: e.target.value })} /></Field>
        </div>
      </Card>
    </form>
  );
}
