"use client";

import type { RestaurantInfo } from "@/db/schema";
import { Btn, Card, Field, Input, Tag, Toggle } from "@/components/admin/ui";
import { SOURCE_PHONES } from "@/lib/source";
import { useSettingsForm } from "./useSettingsForm";

/** Address, coordinates and the phone-number resolver (the source lists two numbers). */
export function ContactForm({ info }: { info: RestaurantInfo }) {
  const { f, set, text, errors, busy, submit } = useSettingsForm(
    {
      addressLine1: info.addressLine1, addressLine2: info.addressLine2 ?? "", city: info.city, state: info.state, zip: info.zip,
      latitude: info.latitude == null ? "" : String(info.latitude), longitude: info.longitude == null ? "" : String(info.longitude), googlePlaceId: info.googlePlaceId ?? "", googleMapsUrl: info.googleMapsUrl ?? "",
      phonePrimary: info.phonePrimary, phoneSecondary: info.phoneSecondary ?? "", featuredPhone: info.featuredPhone as "primary" | "secondary", phoneConfirmed: info.phoneConfirmed, email: info.email ?? "",
    },
    "Contact details saved",
  );
  return (
    <form onSubmit={submit} id="contact">
      <Card title="Contact & location" description="Address, map coordinates and phone numbers used across the site, structured data and the booking confirmation." actions={<Btn type="submit" variant="primary" loading={busy}>Save contact</Btn>}>
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-amber-900">Which phone number should the website feature?</p>
            {f.phoneConfirmed ? <Tag tone="green">Confirmed</Tag> : <Tag tone="amber">Needs confirmation</Tag>}
          </div>
          <ul className="mt-2 space-y-0.5 text-[12.5px] text-amber-900/90">
            {SOURCE_PHONES.map((p) => <li key={p.number}><span className="font-mono font-semibold">{p.number}</span> · seen on {p.seenOn.join(", ")}</li>)}
          </ul>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Primary number" htmlFor="s-phonePrimary" error={errors.phonePrimary} required><Input {...text("phonePrimary")} required /></Field>
            <Field label="Secondary number" htmlFor="s-phoneSecondary" error={errors.phoneSecondary} hint="Leave blank to drop it"><Input {...text("phoneSecondary")} /></Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-6">
            <Field label="Featured number">
              <div className="flex gap-2" role="radiogroup" aria-label="Featured number">
                {(["primary", "secondary"] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2 text-[14px] text-zinc-800">
                    <input type="radio" name="featuredPhone" value={k} checked={f.featuredPhone === k} onChange={() => set("featuredPhone", k)} className="accent-zinc-900" />
                    {k === "primary" ? `Primary (${f.phonePrimary || "…"})` : `Secondary (${f.phoneSecondary || "not set"})`}
                  </label>
                ))}
              </div>
            </Field>
            <Toggle checked={f.phoneConfirmed} onChange={(v) => set("phoneConfirmed", v)} label="I've confirmed this is the right number" description="Clears the reminder on the dashboard" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address" htmlFor="s-addressLine1" error={errors.addressLine1} required><Input {...text("addressLine1")} required /></Field>
          <Field label="Address line 2" htmlFor="s-addressLine2" error={errors.addressLine2}><Input {...text("addressLine2")} /></Field>
          <Field label="City" htmlFor="s-city" error={errors.city} required><Input {...text("city")} required /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State" htmlFor="s-state" error={errors.state} required><Input {...text("state")} required /></Field>
            <Field label="ZIP" htmlFor="s-zip" error={errors.zip} required><Input {...text("zip")} required /></Field>
          </div>
          <Field label="Latitude" htmlFor="s-latitude" error={errors.latitude} hint="Used for the map and directions"><Input {...text("latitude")} inputMode="decimal" /></Field>
          <Field label="Longitude" htmlFor="s-longitude" error={errors.longitude}><Input {...text("longitude")} inputMode="decimal" /></Field>
          <Field label="Google Place ID" htmlFor="s-googlePlaceId" error={errors.googlePlaceId}><Input {...text("googlePlaceId")} /></Field>
          <Field label="Google Maps link" htmlFor="s-googleMapsUrl" error={errors.googleMapsUrl} hint="Used for “Read reviews” and the address link"><Input {...text("googleMapsUrl")} placeholder="https://" /></Field>
          <Field label="Email" htmlFor="s-email" error={errors.email} hint="None was found publicly; shown in the footer when set"><Input type="email" {...text("email")} /></Field>
        </div>
      </Card>
    </form>
  );
}
