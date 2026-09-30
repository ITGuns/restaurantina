"use client";

import { Reorder, useDragControls } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteMenuItem, duplicateMenuItem, reorderItems, setItemFlag, updateItemPrice } from "@/actions/menu";
import { Drawer, ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Input, Select, Tag, centsToInput } from "@/components/admin/ui";
import { DIETARY_LABELS } from "@/lib/constants";
import { describeWindow } from "@/lib/availability";
import type { CategoryNode, GroupNode, ItemNode } from "@/lib/data/menu";
import type { Media } from "@/db/schema";
import { formatRelative, money } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ItemEditor } from "./ItemEditor";

type Status = "all" | "active" | "inactive";

/** Menu control panel: per-category table with drag ordering, inline price edits and quick actions, plus a global search. */
export function MenuManager({ categories, groups, library }: { categories: CategoryNode[]; groups: GroupNode[]; library: Pick<Media, "id" | "file" | "alt" | "tag">[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [catId, setCatId] = useState<number>(() => Number(sp.get("category")) || categories[0]?.id || 0);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState<Status>("all");
  const [featured, setFeatured] = useState(sp.get("featured") === "1");
  const [editing, setEditing] = useState<{ item: ItemNode | null; categoryId?: number; nonce: number } | null>(sp.get("new") ? { item: null, nonce: 1 } : null);
  const [deleting, setDeleting] = useState<ItemNode | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  // "?new=1" (dashboard quick action) opens the editor once; drop it from the URL so reload/back doesn't reopen it.
  useEffect(() => {
    if (!sp.get("new")) return;
    const params = new URLSearchParams(sp.toString());
    params.delete("new");
    router.replace(params.size ? `/admin/menu?${params.toString()}` : "/admin/menu", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = categories.find((c) => c.id === catId) ?? categories[0];
  const searching = q.trim().length > 0 || status !== "all" || featured;
  const matches = (i: ItemNode) => {
    if (status === "active" && !i.active) return false;
    if (status === "inactive" && i.active) return false;
    if (featured && !i.featured && !i.popular) return false;
    const t = q.trim().toLowerCase();
    if (t && !`${i.name} ${i.spanishName ?? ""} ${i.englishName ?? ""} ${i.description ?? ""} ${i.englishDescription ?? ""} ${i.categoryName}`.toLowerCase().includes(t)) return false;
    return true;
  };
  const searchResults = useMemo(() => (searching ? categories.flatMap((c) => c.items.filter(matches)) : []), [categories, q, status, featured]); // eslint-disable-line react-hooks/exhaustive-deps

  const flag = async (item: ItemNode, field: "active" | "featured" | "popular", value: boolean) => {
    setBusy(item.id);
    const res = await setItemFlag(item.id, field, value);
    setBusy(null);
    if (res.ok) {
      toast.success(field === "active" ? (value ? "Item shown" : "Item hidden") : `${field === "featured" ? "Featured" : "Popular"} ${value ? "on" : "off"}`, item.name);
      router.refresh();
    } else toast.error(res.error);
  };
  const duplicate = async (item: ItemNode) => {
    setBusy(item.id);
    const res = await duplicateMenuItem(item.id);
    setBusy(null);
    if (res.ok) {
      toast.success("Duplicated as hidden copy", `${item.name} (copy)`);
      router.refresh();
    } else toast.error(res.error);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(deleting.id);
    const res = await deleteMenuItem(deleting.id);
    setBusy(null);
    setDeleting(null);
    if (res.ok) {
      toast.success("Item deleted");
      router.refresh();
    } else toast.error(res.error);
  };

  const row = (item: ItemNode, withCategory = false) => (
    <ItemRowBody item={item} withCategory={withCategory} busy={busy === item.id} onEdit={() => setEditing({ item, nonce: item.id })} onFlag={(f, v) => flag(item, f, v)} onDuplicate={() => duplicate(item)} onDelete={() => setDeleting(item)} />
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" className="w-56" aria-label="Search items" />
          <Select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-36" aria-label="Status filter">
            <option value="all">All items</option>
            <option value="active">Active only</option>
            <option value="inactive">Hidden only</option>
          </Select>
          <label className="flex items-center gap-2 text-[13px] text-zinc-700"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-zinc-900" /> Featured / popular only</label>
          {searching && <Btn size="sm" variant="ghost" onClick={() => { setQ(""); setStatus("all"); setFeatured(false); }}>Clear</Btn>}
        </div>
        <Btn variant="primary" onClick={() => setEditing({ item: null, categoryId: category?.id, nonce: Date.now() })}>+ Add Menu Item</Btn>
      </div>

      {searching ? (
        <Card title={`${searchResults.length} matching item${searchResults.length === 1 ? "" : "s"}`} padded={false}>
          {searchResults.length === 0 ? <div className="p-5"><EmptyState title="No menu items found" /></div> : <ul className="divide-y divide-zinc-100 px-4">{searchResults.map((i) => <li key={i.id}>{row(i, true)}</li>)}</ul>}
        </Card>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="min-w-0 lg:sticky lg:top-8 lg:self-start" aria-label="Categories">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {categories.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setCatId(c.id)} className={cn("flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[14px] font-medium transition", c.id === category?.id ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100", !c.active && "opacity-60")}>
                    <span>{c.name}{!c.active && " (hidden)"}</span>
                    <span className={cn("text-[12px]", c.id === category?.id ? "text-white/70" : "text-zinc-400")}>{c.items.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0">
            {category ? <CategoryPanel key={category.id} category={category} row={row} onAddItem={() => setEditing({ item: null, categoryId: category.id, nonce: Date.now() })} /> : <EmptyState title="No categories yet" body="Create a category first under Menu → Categories." />}
          </div>
        </div>
      )}

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.item ? `Edit ${editing.item.name}` : "New menu item"} description={editing?.item ? `${editing.item.categoryName} · /${editing.item.slug} · updated ${formatRelative(editing.item.updatedAt)}` : undefined}>
        {editing && (
          <ItemEditor
            key={editing.item ? `item-${editing.item.id}` : `new-${editing.nonce}`}
            item={editing.item}
            defaultCategoryId={editing.categoryId ?? category?.id}
            categories={categories}
            groups={groups}
            library={library}
            onSaved={(mode) => {
              router.refresh();
              if (mode === "another") setEditing({ item: null, categoryId: editing.categoryId, nonce: Date.now() });
              else setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        )}
      </Drawer>

      <ConfirmDialog open={!!deleting} title={`Delete "${deleting?.name}"?`} body="This permanently removes the item. Use Hide to keep it for later." confirmLabel="Delete item" loading={busy === deleting?.id} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </>
  );
}

function ItemRowBody({ item, withCategory, busy, onEdit, onFlag, onDuplicate, onDelete }: { item: ItemNode; withCategory: boolean; busy: boolean; onEdit: () => void; onFlag: (f: "active" | "featured" | "popular", v: boolean) => void; onDuplicate: () => void; onDelete: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [price, setPrice] = useState(centsToInput(item.price));
  const [editingPrice, setEditingPrice] = useState(false);
  useEffect(() => setPrice(centsToInput(item.price)), [item.price]);
  const savePrice = async () => {
    setEditingPrice(false);
    if (price === centsToInput(item.price)) return;
    const res = await updateItemPrice(item.id, price);
    if (res.ok) {
      toast.success("Price updated", item.name);
      router.refresh();
    } else {
      toast.error(res.error);
      setPrice(centsToInput(item.price));
    }
  };
  const windows = item.availability.filter((w) => w.active);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 sm:flex-nowrap", !item.active && "opacity-60")} data-testid="menu-row">
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-zinc-100">
        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center bg-zinc-900 font-serif text-[16px] italic text-amber-200">{item.name[0]}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={onEdit} className="truncate text-[14px] font-medium text-zinc-900 hover:underline">{item.name}</button>
          {item.englishName && <span className="text-[12px] text-zinc-500">{item.englishName}</span>}
          {item.featured && <Tag tone="amber">Featured</Tag>}
          {item.popular && <Tag tone="purple">Popular</Tag>}
          {!item.active && <Tag tone="gray">Hidden</Tag>}
          {windows.length > 0 && <Tag tone="blue">{item.availabilityNote ?? describeWindow(windows[0])}</Tag>}
          {item.dietaryTags.map((t) => <Tag key={t} tone="green">{DIETARY_LABELS[t].short}</Tag>)}
        </div>
        <p className="truncate text-[12px] text-zinc-500">
          {withCategory && `${item.categoryName} · `}{item.description ?? item.englishDescription ?? item.notes ?? "No description"}{item.modifierGroups.length ? ` · ${item.modifierGroups.length} option group${item.modifierGroups.length > 1 ? "s" : ""}` : ""} · updated {formatRelative(item.updatedAt)}
        </p>
      </div>
      <span className="w-28 text-right text-[14px] font-medium tabular-nums text-zinc-900">
        {editingPrice ? (
          <Input value={price} onChange={(e) => setPrice(e.target.value)} onBlur={savePrice} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); savePrice(); } if (e.key === "Escape") { setPrice(centsToInput(item.price)); setEditingPrice(false); } }} autoFocus inputMode="decimal" className="h-8 w-24 text-right" aria-label={`Price for ${item.name}`} />
        ) : (
          <button type="button" onClick={() => setEditingPrice(true)} title="Click to edit price" className="rounded px-1.5 py-1 hover:bg-zinc-100">
            {item.price == null ? <span className="text-zinc-400">{item.priceNote ?? "no price"}</span> : money(item.price)}
            {item.price != null && item.priceNote && <span className="block text-[11px] font-normal text-zinc-400">{item.priceNote}</span>}
          </button>
        )}
      </span>
      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-1 sm:w-auto">
        <Btn size="sm" variant="ghost" onClick={() => onFlag("featured", !item.featured)} disabled={busy} title="Toggle featured">{item.featured ? "★" : "☆"}</Btn>
        <Btn size="sm" variant="ghost" onClick={() => onFlag("active", !item.active)} disabled={busy}>{item.active ? "Hide" : "Show"}</Btn>
        <Btn size="sm" variant="ghost" onClick={onDuplicate} disabled={busy}>Duplicate</Btn>
        <Btn size="sm" onClick={onEdit}>Edit</Btn>
        <Btn size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>Delete</Btn>
      </div>
    </div>
  );
}

function CategoryPanel({ category, row, onAddItem }: { category: CategoryNode; row: (i: ItemNode) => React.ReactNode; onAddItem: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState(category.items);
  const dirty = useRef(false);
  useEffect(() => setItems(category.items), [category.items]);

  const commit = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    const res = await reorderItems(category.id, items.map((i) => i.id));
    if (res.ok) {
      toast.success("Item order saved");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <Card title={category.name} description={`${category.note ?? category.description ?? ""}${category.note || category.description ? " · " : ""}Drag ⋮⋮ to reorder. Click a price to edit it.`} padded={false} actions={<Btn size="sm" variant="primary" onClick={onAddItem}>+ Item</Btn>}>
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-[13px] text-zinc-500">No items yet. <button type="button" onClick={onAddItem} className="font-medium text-zinc-900 underline">Add one</button></div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={(next) => { setItems(next); dirty.current = true; }} className="divide-y divide-zinc-100 px-3">
          {items.map((i) => <ItemRow key={i.id} item={i} onDragEnd={commit}>{row(i)}</ItemRow>)}
        </Reorder.Group>
      )}
    </Card>
  );
}

function ItemRow({ item, children, onDragEnd }: { item: ItemNode; children: React.ReactNode; onDragEnd: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} as="div" className="flex items-center gap-1 bg-white">
      <button type="button" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none px-1 text-zinc-300 hover:text-zinc-700 active:cursor-grabbing" aria-label="Drag to reorder item">⋮⋮</button>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}
