"use client";

import { Reorder, useDragControls } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { assignMedia, deleteMedia, reorderMedia, replaceMediaFile, saveMedia, uploadMedia } from "@/actions/media";
import type { Media, MediaTag } from "@/db/schema";
import { MEDIA_TAGS } from "@/db/schema";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Field, Input, Segmented, Select, Tag, Textarea, Toggle } from "@/components/admin/ui";
import { MEDIA_TAG_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

type ItemOption = { id: number; name: string; categoryName: string; image: string | null };
type Usage = { heroImage: string | null; ogImageUrl: string | null; logo: string | null };

/** Media library: grid/list of images with upload, replace, metadata, focal point, ordering and assignment to menu items or the hero. */
export function MediaManager({ media, items, usage }: { media: Media[]; items: ItemOption[]; usage: Usage }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(media);
  const [editing, setEditing] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState<Media | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [filter, setFilter] = useState<"all" | MediaTag>("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);
  useEffect(() => setList(media), [media]);

  const shown = filter === "all" ? list : list.filter((m) => m.tag === filter);
  const usedBy = (m: Media) => {
    const out: string[] = [];
    if (usage.heroImage === m.file) out.push("Hero");
    if (usage.ogImageUrl === m.file) out.push("Share image");
    if (usage.logo === m.file) out.push("Logo");
    items.filter((i) => i.image === m.file).forEach((i) => out.push(i.name));
    return out;
  };

  const commitOrder = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    const res = await reorderMedia(list.map((m) => m.id));
    if (res.ok) {
      toast.success("Order saved");
      router.refresh();
    } else toast.error(res.error);
  };

  const upload = async (files: FileList) => {
    setUploading(files.length);
    let ok = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tag", filter === "all" ? "food" : filter);
      const res = await uploadMedia(fd);
      if (res.ok) ok++;
      else toast.error(`${file.name}: ${res.error}`);
      setUploading((n) => n - 1);
    }
    if (ok) toast.success(`${ok} image${ok > 1 ? "s" : ""} uploaded`, "Add alt text and a caption to each one.");
    router.refresh();
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await deleteMedia(deleting.id);
    setBusy(false);
    setDeleting(null);
    if (res.ok) {
      toast.success("Image deleted");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, ...(["food", "menu", "gallery", "hero", "brand", "interior", "other"] as const).map((t) => ({ value: t, label: MEDIA_TAG_LABELS[t] }))]} />
          <span className="text-[13px] text-zinc-500">{shown.length} of {list.length} images</span>
        </div>
        <div className="flex items-center gap-2">
          <Segmented value={layout} onChange={setLayout} options={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]} />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files?.length && upload(e.target.files)} />
          <Btn variant="primary" onClick={() => fileRef.current?.click()} loading={uploading > 0}>{uploading ? `Uploading ${uploading}…` : "+ Upload images"}</Btn>
        </div>
      </div>

      <Card padded={false}>
        {shown.length === 0 ? (
          <div className="p-5"><EmptyState title="No images yet" body="Upload JPG, PNG or WebP photos up to 6 MB. They become available for the gallery, hero and menu items." action={<Btn onClick={() => fileRef.current?.click()}>Upload images</Btn>} /></div>
        ) : layout === "grid" ? (
          <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((m) => (
              <li key={m.id} data-testid="media-row" className={cn("group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50", !m.active && "opacity-60")}>
                <button type="button" onClick={() => setEditing(m)} className="block aspect-square w-full overflow-hidden bg-zinc-100" aria-label={`Edit ${m.alt}`}>
                  <img src={m.file} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" style={{ objectPosition: `${m.focalX}% ${m.focalY}%` }} />
                </button>
                <div className="space-y-1 px-2.5 py-2">
                  <p className="truncate text-[12px] font-medium text-zinc-900">{m.alt}</p>
                  <div className="flex flex-wrap gap-1">
                    <Tag tone="gray">{MEDIA_TAG_LABELS[m.tag]}</Tag>
                    {m.featured && <Tag tone="amber">Featured</Tag>}
                    {!m.inGallery && <Tag tone="blue">Not in gallery</Tag>}
                    {usedBy(m).slice(0, 2).map((u) => <Tag key={u} tone="purple">{u}</Tag>)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : filter === "all" ? (
          <Reorder.Group axis="y" values={list} onReorder={(n) => { setList(n); dirty.current = true; }} className="divide-y divide-zinc-100">
            {list.map((m) => <MediaRow key={m.id} m={m} usedBy={usedBy(m)} draggable onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} onDragEnd={commitOrder} />)}
          </Reorder.Group>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {shown.map((m) => <MediaRow key={m.id} m={m} usedBy={usedBy(m)} onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} />)}
          </ul>
        )}
        <p className="border-t border-zinc-100 px-4 py-2 text-[12px] text-zinc-500">Switch to List with “All” selected and drag ⋮⋮ to set the gallery order.</p>
      </Card>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Edit image" description={editing ? `${editing.width}×${editing.height} · ${editing.file}` : undefined}>
        {editing && <MediaForm key={editing.id} m={editing} items={items} usedBy={usedBy(editing)} onDone={() => { setEditing(null); router.refresh(); }} onDelete={() => { const m = editing; setEditing(null); setDeleting(m); }} />}
      </Drawer>
      <ConfirmDialog open={!!deleting} title="Delete this image?" body={deleting ? `"${deleting.alt}" will be removed from the library and gallery. Menu items or settings that point at it will show no image until you pick another.` : ""} confirmLabel="Delete image" loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}

function MediaRow({ m, usedBy, draggable, onEdit, onDelete, onDragEnd }: { m: Media; usedBy: string[]; draggable?: boolean; onEdit: () => void; onDelete: () => void; onDragEnd?: () => void }) {
  const controls = useDragControls();
  const inner = (
    <>
      {draggable && <button type="button" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none px-1 text-zinc-300 hover:text-zinc-700 active:cursor-grabbing" aria-label="Drag to reorder">⋮⋮</button>}
      <span className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-zinc-100">
        <img src={m.file} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${m.focalX}% ${m.focalY}%` }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-[14px] font-medium text-zinc-900">
          <button type="button" onClick={onEdit} className="truncate hover:underline">{m.alt}</button>
          <Tag tone="gray">{MEDIA_TAG_LABELS[m.tag]}</Tag>
          {m.featured && <Tag tone="amber">Featured</Tag>}
          {!m.inGallery && <Tag tone="blue">Not in gallery</Tag>}
          {!m.active && <Tag tone="red">Hidden</Tag>}
          {usedBy.map((u) => <Tag key={u} tone="purple">{u}</Tag>)}
        </p>
        <p className="truncate text-[12px] text-zinc-500">{m.caption ?? m.file} · {m.width}×{m.height} · focal {m.focalX}%, {m.focalY}%</p>
      </div>
      <Btn size="sm" onClick={onEdit}>Edit</Btn>
      <Btn size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>Delete</Btn>
    </>
  );
  if (!draggable) return <li data-testid="media-row" className={cn("flex items-center gap-3 px-4 py-2.5", !m.active && "opacity-60")}>{inner}</li>;
  return (
    <Reorder.Item value={m} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} as="div" data-testid="media-row" className={cn("flex items-center gap-3 bg-white px-4 py-2.5", !m.active && "opacity-60")}>
      {inner}
    </Reorder.Item>
  );
}

function MediaForm({ m, items, usedBy, onDone, onDelete }: { m: Media; items: ItemOption[]; usedBy: string[]; onDone: () => void; onDelete: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ alt: m.alt, caption: m.caption ?? "", tag: m.tag as MediaTag, focalX: m.focalX, focalY: m.focalY, featured: m.featured, inGallery: m.inGallery, active: m.active });
  const [file, setFile] = useState(m.file);
  const [assignItem, setAssignItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<false | "save" | "replace" | "assign">(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("save");
    const res = await saveMedia({ ...f, id: m.id });
    setBusy(false);
    if (res.ok) {
      toast.success("Image saved", f.alt);
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };
  const replace = async (picked: File) => {
    setBusy("replace");
    const fd = new FormData();
    fd.append("file", picked);
    const res = await replaceMediaFile(m.id, fd);
    setBusy(false);
    if (res.ok) {
      setFile(res.data.file);
      toast.success("File replaced", `${res.data.width}×${res.data.height}`);
    } else toast.error(res.error);
  };
  const assign = async (target: Parameters<typeof assignMedia>[1], label: string) => {
    setBusy("assign");
    const res = await assignMedia(m.id, target);
    setBusy(false);
    if (res.ok) {
      toast.success(`Assigned to ${label}`);
      router.refresh();
    } else toast.error(res.error);
  };
  const pickFocal = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setF({ ...f, focalX: Math.round(((e.clientX - r.left) / r.width) * 100), focalY: Math.round(((e.clientY - r.top) / r.height) * 100) });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-zinc-700">Focal point <span className="font-normal text-zinc-500">· click the photo where the subject is; crops keep that spot visible</span></p>
        <div role="button" tabIndex={0} aria-label="Set focal point" onClick={pickFocal} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.preventDefault(); }} className="relative aspect-[16/10] w-full cursor-crosshair overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
          <img src={file} alt="" className="h-full w-full object-contain" />
          <span aria-hidden className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500/80 shadow" style={{ left: `${f.focalX}%`, top: `${f.focalY}%` }} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Focal X (%)" htmlFor="m-fx"><Input id="m-fx" type="number" min={0} max={100} value={f.focalX} onChange={(e) => setF({ ...f, focalX: Number(e.target.value) })} /></Field>
          <Field label="Focal Y (%)" htmlFor="m-fy"><Input id="m-fy" type="number" min={0} max={100} value={f.focalY} onChange={(e) => setF({ ...f, focalY: Number(e.target.value) })} /></Field>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && replace(e.target.files[0])} />
          <Btn size="sm" type="button" onClick={() => fileRef.current?.click()} loading={busy === "replace"}>Replace file</Btn>
          <span className="text-[12px] text-zinc-500">Keeps alt text, tag, ordering and every place this photo is used.</span>
        </div>
      </div>
      <Field label="Alt text" htmlFor="m-alt" error={errors.alt} required hint="Describe the photo for screen readers and search engines"><Input id="m-alt" value={f.alt} onChange={(e) => setF({ ...f, alt: e.target.value })} required /></Field>
      <Field label="Caption" htmlFor="m-cap" error={errors.caption} hint="Shown on hover and in the lightbox"><Textarea id="m-cap" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /></Field>
      <Field label="Tag" htmlFor="m-tag">
        <Select id="m-tag" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value as MediaTag })}>
          {MEDIA_TAGS.map((t) => <option key={t} value={t}>{MEDIA_TAG_LABELS[t]}</option>)}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Toggle checked={f.inGallery} onChange={(v) => setF({ ...f, inGallery: v })} label="In gallery" description="Show on the gallery page, carousel and bento" />
        <Toggle checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} label="Featured" description="Prefer this photo for section imagery" />
        <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" description="Hidden images stay in the library only" />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-[13px] font-semibold text-zinc-800">Assign this photo</p>
        {usedBy.length > 0 && <p className="mt-1 text-[12px] text-zinc-500">Currently used by: {usedBy.join(", ")}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Btn size="sm" type="button" onClick={() => assign({ type: "hero" }, "the homepage hero")} loading={busy === "assign"}>Use as hero image</Btn>
          <Btn size="sm" type="button" onClick={() => assign({ type: "og" }, "the share image")} disabled={busy === "assign"}>Use as share image</Btn>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select value={assignItem} onChange={(e) => setAssignItem(e.target.value)} className="w-72" aria-label="Menu item">
            <option value="">Choose a menu item…</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.categoryName}</option>)}
          </Select>
          <Btn size="sm" type="button" disabled={!assignItem || busy === "assign"} onClick={() => { const it = items.find((i) => String(i.id) === assignItem); if (it) assign({ type: "item", itemId: it.id }, it.name); }}>Assign to item</Btn>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-4">
        <Btn type="button" variant="ghost" className="text-red-600" onClick={onDelete}>Delete image</Btn>
        <div className="flex gap-2">
          <Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn>
          <Btn type="submit" variant="primary" loading={busy === "save"}>Save image</Btn>
        </div>
      </div>
    </form>
  );
}
