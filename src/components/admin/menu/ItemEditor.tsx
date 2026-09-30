"use client";

import { useState } from "react";
import { deleteMenuItem, saveMenuItem } from "@/actions/menu";
import type { DietaryTag, Media } from "@/db/schema";
import { DIETARY_TAGS } from "@/db/schema";
import { Btn, Checkbox, DaysPicker, Field, Input, Select, Textarea, Toggle, centsToInput } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { DIETARY_LABELS } from "@/lib/constants";
import type { CategoryNode, GroupNode, ItemNode } from "@/lib/data/menu";
import { ImageUpload } from "./ImageUpload";

type Window = { days: number[]; startTime: string; endTime: string; active: boolean };
type Form = {
  categoryId: string; name: string; spanishName: string; englishName: string; description: string; englishDescription: string; price: string; priceNote: string; image: string; imageAlt: string;
  dietaryTags: DietaryTag[]; availabilityNote: string; availability: Window[]; notes: string; featured: boolean; popular: boolean; active: boolean; modifierGroupIds: number[];
};

/** Full menu item editor: bilingual fields, price, photo, dietary tags, availability windows, options, flags. */
export function ItemEditor({ item, defaultCategoryId, categories, groups, library, onSaved, onClose }: { item: ItemNode | null; defaultCategoryId?: number; categories: CategoryNode[]; groups: GroupNode[]; library: Pick<Media, "id" | "file" | "alt" | "tag">[]; onSaved: (mode: "close" | "another") => void; onClose: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<Form>({
    categoryId: String(item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? ""),
    name: item?.name ?? "",
    spanishName: item?.spanishName ?? "",
    englishName: item?.englishName ?? "",
    description: item?.description ?? "",
    englishDescription: item?.englishDescription ?? "",
    price: centsToInput(item?.price),
    priceNote: item?.priceNote ?? "",
    image: item?.image ?? "",
    imageAlt: item?.imageAlt ?? "",
    dietaryTags: item?.dietaryTags ?? [],
    availabilityNote: item?.availabilityNote ?? "",
    availability: item?.availability.map((w) => ({ days: w.days, startTime: w.startTime ?? "", endTime: w.endTime ?? "", active: w.active })) ?? [],
    notes: item?.notes ?? "",
    featured: item?.featured ?? false,
    popular: item?.popular ?? false,
    active: item?.active ?? true,
    modifierGroupIds: item?.modifierGroups.map((g) => g.id) ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<false | "close" | "another" | "archive" | "delete">(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async (mode: "close" | "another", overrides: Partial<Form> = {}) => {
    setBusy(mode);
    setErrors({});
    const payload = { ...f, ...overrides, id: item?.id, categoryId: Number(f.categoryId) };
    const res = await saveMenuItem(payload);
    setBusy(false);
    if (res.ok) {
      toast.success(item ? "Item saved" : "Item created", f.name);
      onSaved(mode);
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const archive = async () => {
    setBusy("archive");
    const res = await saveMenuItem({ ...f, id: item?.id, categoryId: Number(f.categoryId), active: false });
    setBusy(false);
    if (res.ok) {
      toast.success("Item archived", "Hidden from the public menu.");
      onSaved("close");
    } else toast.error(res.error);
  };

  const remove = async () => {
    if (!item) return;
    setBusy("delete");
    const res = await deleteMenuItem(item.id);
    setBusy(false);
    setConfirmDelete(false);
    if (res.ok) {
      toast.success("Item deleted");
      onSaved("close");
    } else toast.error(res.error);
  };

  const toggleTag = (t: DietaryTag) => set("dietaryTags", f.dietaryTags.includes(t) ? f.dietaryTags.filter((x) => x !== t) : [...f.dietaryTags, t]);
  const toggleGroup = (id: number) => set("modifierGroupIds", f.modifierGroupIds.includes(id) ? f.modifierGroupIds.filter((x) => x !== id) : [...f.modifierGroupIds, id]);
  const updateWindow = (i: number, patch: Partial<Window>) => set("availability", f.availability.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));

  return (
    <form onSubmit={(e) => { e.preventDefault(); save("close"); }} className="space-y-6">
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Item name" htmlFor="i-name" error={errors.name} required hint="As printed on the menu (Spanish slang names stay exactly as they are)"><Input id="i-name" value={f.name} onChange={(e) => set("name", e.target.value)} error={!!errors.name} required /></Field>
          <Field label="Category" htmlFor="i-cat" error={errors.categoryId} required>
            <Select id="i-cat" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (hidden)"}</option>)}
            </Select>
          </Field>
          <Field label="Spanish name" htmlFor="i-es" error={errors.spanishName} hint="Optional formal Spanish name, e.g. “Milanesa de res”"><Input id="i-es" lang="es" value={f.spanishName} onChange={(e) => set("spanishName", e.target.value)} error={!!errors.spanishName} /></Field>
          <Field label="English name" htmlFor="i-en" error={errors.englishName} hint="Optional translation shown next to the name"><Input id="i-en" value={f.englishName} onChange={(e) => set("englishName", e.target.value)} error={!!errors.englishName} /></Field>
        </div>
        <Field label="Description (Spanish)" htmlFor="i-desc" error={errors.description}><Textarea id="i-desc" lang="es" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Huevos revueltos con jamón" /></Field>
        <Field label="English description" htmlFor="i-desc-en" error={errors.englishDescription} hint="Optional; shown under the Spanish description"><Textarea id="i-desc-en" value={f.englishDescription} onChange={(e) => set("englishDescription", e.target.value)} placeholder="Scrambled eggs with ham" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price ($)" htmlFor="i-price" error={errors.price} hint="Leave blank for no price"><Input id="i-price" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} error={!!errors.price} placeholder="14.70" /></Field>
          <Field label="Price note / secondary text" htmlFor="i-pnote" error={errors.priceNote} hint='e.g. "Solos: $13.65"'><Input id="i-pnote" value={f.priceNote} onChange={(e) => set("priceNote", e.target.value)} /></Field>
        </div>
      </section>

      <section className="space-y-3 border-t border-zinc-100 pt-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">Photo</h3>
        <ImageUpload value={f.image} onChange={(v) => set("image", v)} library={library} altSuggestion={f.name} />
        <Field label="Image alt text" htmlFor="i-alt" error={errors.imageAlt}><Input id="i-alt" value={f.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} placeholder="Describe the photo for screen readers" /></Field>
        <p className="text-[12px] text-zinc-500">Items without a photo get a typographic tile. No stock or generated photos are used.</p>
      </section>

      <section className="space-y-3 border-t border-zinc-100 pt-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">Dietary tags</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {DIETARY_TAGS.map((t) => <Checkbox key={t} checked={f.dietaryTags.includes(t)} onChange={() => toggleTag(t)} label={<span>{DIETARY_LABELS[t].label} <span className="text-zinc-400">({DIETARY_LABELS[t].short})</span></span>} />)}
        </div>
      </section>

      <section className="space-y-4 border-t border-zinc-100 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">Availability</h3>
          <Btn type="button" size="sm" onClick={() => set("availability", [...f.availability, { days: [], startTime: "", endTime: "", active: true }])}>+ Add window</Btn>
        </div>
        {f.availability.length === 0 && <p className="text-[13px] text-zinc-500">Follows restaurant hours. Add a window to serve this item only on certain days or times (e.g. weekends until 1 PM).</p>}
        {f.availability.map((w, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-zinc-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-zinc-700">Window {i + 1}</span>
              <Btn type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => set("availability", f.availability.filter((_, idx) => idx !== i))}>Remove</Btn>
            </div>
            <Field label="Days" hint="Leave all unselected for every day"><DaysPicker value={w.days} onChange={(v) => updateWindow(i, { days: v })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor={`w-${i}-s`} error={errors[`availability.${i}.startTime`]} hint="Optional"><Input id={`w-${i}-s`} type="time" value={w.startTime} onChange={(e) => updateWindow(i, { startTime: e.target.value })} /></Field>
              <Field label="Until" htmlFor={`w-${i}-e`} error={errors[`availability.${i}.endTime`]} hint="Optional"><Input id={`w-${i}-e`} type="time" value={w.endTime} onChange={(e) => updateWindow(i, { endTime: e.target.value })} /></Field>
            </div>
            <Toggle checked={w.active} onChange={(v) => updateWindow(i, { active: v })} label="Active" />
          </div>
        ))}
        <Field label="Availability label" htmlFor="i-anote" error={errors.availabilityNote} hint='Badge shown on the menu, e.g. "Weekends only"'><Input id="i-anote" value={f.availabilityNote} onChange={(e) => set("availabilityNote", e.target.value)} /></Field>
      </section>

      <section className="space-y-3 border-t border-zinc-100 pt-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">Modifiers & options</h3>
        {groups.length === 0 ? (
          <p className="text-[13px] text-zinc-500">No modifier groups yet. Create them under Menu → Modifiers.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((g) => (
              <Checkbox key={g.id} checked={f.modifierGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} label={<span>{g.name} <span className="text-zinc-400">· {g.modifiers.length} options{g.required ? " · required" : ""}</span></span>} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-zinc-100 pt-5">
        <Field label="Notes" htmlFor="i-notes" error={errors.notes} hint="Shown under the description (pairings, allergens…)"><Textarea id="i-notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        <div className="flex flex-wrap gap-6">
          <Toggle checked={f.featured} onChange={(v) => set("featured", v)} label="Featured" description="Homepage featured dishes" />
          <Toggle checked={f.popular} onChange={(v) => set("popular", v)} label="Popular" description="Sabores de Tina showcase + Popular badge" />
          <Toggle checked={f.active} onChange={(v) => set("active", v)} label="Active" description="Visible on the public menu" />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-5">
        <div className="flex gap-2">
          {item && f.active && <Btn type="button" variant="outline" onClick={archive} loading={busy === "archive"}>Archive item</Btn>}
          {item && <Btn type="button" variant="ghost" className="text-red-600" onClick={() => setConfirmDelete(true)}>Delete</Btn>}
        </div>
        <div className="flex gap-2">
          <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
          {!item && <Btn type="button" onClick={() => save("another")} loading={busy === "another"}>Save & add another</Btn>}
          <Btn type="submit" variant="primary" loading={busy === "close"}>Save changes</Btn>
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} title={`Delete "${item?.name}"?`} body="This removes the item permanently. Archive it instead if you might bring it back." confirmLabel="Delete item" loading={busy === "delete"} onConfirm={remove} onCancel={() => setConfirmDelete(false)} />
    </form>
  );
}
