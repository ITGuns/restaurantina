"use client";

import { Reorder, useDragControls } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteCategory, reorderCategories, saveCategory, setCategoryFlag } from "@/actions/menu";
import type { Media } from "@/db/schema";
import { ImageUpload } from "./ImageUpload";
import { Drawer, ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Field, Input, Tag, Textarea, Toggle } from "@/components/admin/ui";
import type { CategoryNode } from "@/lib/data/menu";
import { cn } from "@/lib/cn";

export function CategoriesManager({ categories, library }: { categories: CategoryNode[]; library: Pick<Media, "id" | "file" | "alt" | "tag">[] }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(categories);
  const [editing, setEditing] = useState<CategoryNode | null | "new">(null);
  const [deleting, setDeleting] = useState<CategoryNode | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);
  useEffect(() => setList(categories), [categories]);

  const commit = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    const res = await reorderCategories(list.map((c) => c.id));
    if (res.ok) {
      toast.success("Category order saved");
      router.refresh();
    } else toast.error(res.error);
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await deleteCategory(deleting.id);
    setBusy(false);
    setDeleting(null);
    if (res.ok) {
      toast.success("Category deleted");
      router.refresh();
    } else toast.error(res.error);
  };
  const toggle = async (c: CategoryNode) => {
    const res = await setCategoryFlag(c.id, !c.active);
    if (res.ok) {
      toast.success(c.active ? "Category hidden" : "Category shown", c.name);
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <>
      <div className="mb-4 flex justify-end"><Btn variant="primary" onClick={() => setEditing("new")}>+ New category</Btn></div>
      <Card padded={false}>
        {list.length === 0 ? (
          <div className="p-5"><EmptyState title="No categories" /></div>
        ) : (
          <Reorder.Group axis="y" values={list} onReorder={(n) => { setList(n); dirty.current = true; }} className="divide-y divide-zinc-100">
            {list.map((c) => <CategoryRow key={c.id} category={c} onEdit={() => setEditing(c)} onToggle={() => toggle(c)} onDelete={() => setDeleting(c)} onDragEnd={commit} />)}
          </Reorder.Group>
        )}
      </Card>
      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : `Edit ${editing?.name ?? ""}`} width="max-w-lg">
        {editing !== null && <CategoryForm key={editing === "new" ? "new" : editing.id} category={editing === "new" ? null : editing} library={library} onDone={() => { setEditing(null); router.refresh(); }} />}
      </Drawer>
      <ConfirmDialog open={!!deleting} title={`Delete "${deleting?.name}"?`} body={`This deletes the category and its ${deleting?.items.length ?? 0} items.`} confirmLabel="Delete category" loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}

function CategoryRow({ category: c, onEdit, onToggle, onDelete, onDragEnd }: { category: CategoryNode; onEdit: () => void; onToggle: () => void; onDelete: () => void; onDragEnd: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={c} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} as="div" className={cn("flex items-center gap-3 bg-white px-4 py-3", !c.active && "opacity-60")}>
      <button type="button" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none text-zinc-400 hover:text-zinc-700 active:cursor-grabbing" aria-label="Drag to reorder">⋮⋮</button>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-zinc-900">{c.name} {c.englishName && <span className="text-[12px] font-normal text-zinc-500">{c.englishName}</span>} <span className="font-mono text-[11px] text-zinc-400">/{c.slug}</span> {!c.active && <Tag tone="gray">Hidden</Tag>}</p>
        <p className="truncate text-[12px] text-zinc-500">{c.items.length} {c.items.length === 1 ? "item" : "items"}{c.note ? ` · ${c.note}` : ""}</p>
      </div>
      <Btn size="sm" variant="ghost" onClick={onToggle}>{c.active ? "Hide" : "Show"}</Btn>
      <Btn size="sm" onClick={onEdit}>Edit</Btn>
      <Btn size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>Delete</Btn>
    </Reorder.Item>
  );
}

function CategoryForm({ category, library, onDone }: { category: CategoryNode | null; library: Pick<Media, "id" | "file" | "alt" | "tag">[]; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: category?.name ?? "",
    englishName: category?.englishName ?? "",
    description: category?.description ?? "",
    englishDescription: category?.englishDescription ?? "",
    note: category?.note ?? "",
    englishNote: category?.englishNote ?? "",
    image: category?.image ?? "",
    active: category?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveCategory({ ...f, id: category?.id });
    setBusy(false);
    if (res.ok) {
      toast.success(category ? "Category saved" : "Category created", f.name);
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" error={errors.name} required hint="As printed on the menu, e.g. Desayunos"><Input id="c-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
        <Field label="English name" htmlFor="c-en" error={errors.englishName} hint="Optional, e.g. Breakfast"><Input id="c-en" value={f.englishName} onChange={(e) => setF({ ...f, englishName: e.target.value })} /></Field>
      </div>
      <Field label="Note" htmlFor="c-note" error={errors.note} hint='Shown under the category title, e.g. "Todos acompañados de frijoles con queso"'><Input id="c-note" lang="es" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <Field label="English note" htmlFor="c-note-en" error={errors.englishNote}><Input id="c-note-en" value={f.englishNote} onChange={(e) => setF({ ...f, englishNote: e.target.value })} /></Field>
      <Field label="Description" htmlFor="c-desc" error={errors.description}><Textarea id="c-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="English description" htmlFor="c-desc-en" error={errors.englishDescription}><Textarea id="c-desc-en" value={f.englishDescription} onChange={(e) => setF({ ...f, englishDescription: e.target.value })} /></Field>
      <Field label="Category photo" hint="Optional; used as a backdrop where the category is featured"><ImageUpload value={f.image} onChange={(v) => setF({ ...f, image: v })} library={library} altSuggestion={f.name} /></Field>
      <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" description="Hidden categories don't appear on the public menu" />
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn>
        <Btn type="submit" variant="primary" loading={busy}>{category ? "Save" : "Create category"}</Btn>
      </div>
    </form>
  );
}
