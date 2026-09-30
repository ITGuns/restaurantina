"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteModifier, deleteModifierGroup, saveModifier, saveModifierGroup } from "@/actions/menu";
import type { Modifier } from "@/db/schema";
import { Drawer, ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Field, Input, Tag, Textarea, Toggle, centsToInput } from "@/components/admin/ui";
import type { GroupNode } from "@/lib/data/menu";
import { priceAdjustment } from "@/lib/format";
import { cn } from "@/lib/cn";

type Editing = { kind: "group"; group: GroupNode | null } | { kind: "modifier"; groupId: number; modifier: Modifier | null } | null;

/** Modifier groups (e.g. "Guisado") and their options, attachable to any menu item from the item editor. */
export function ModifiersManager({ groups }: { groups: GroupNode[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<{ kind: "group" | "modifier"; id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = deleting.kind === "group" ? await deleteModifierGroup(deleting.id) : await deleteModifier(deleting.id);
    setBusy(false);
    setDeleting(null);
    if (res.ok) {
      toast.success(deleting.kind === "group" ? "Group deleted" : "Option deleted");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <>
      <div className="mb-4 flex justify-end"><Btn variant="primary" onClick={() => setEditing({ kind: "group", group: null })}>+ New modifier group</Btn></div>
      {groups.length === 0 ? (
        <Card><EmptyState title="No modifier groups yet" body='Create a group like "Guisado" with options (mole, chile verde…) and attach it to burritos, chimichangas or quesadillas from the item editor.' action={<Btn onClick={() => setEditing({ kind: "group", group: null })}>Create a group</Btn>} /></Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.id} title={g.name} description={`${g.required ? "Required" : "Optional"} · choose ${g.minSelections}–${g.maxSelections}${g.description ? ` · ${g.description}` : ""}`} padded={false} actions={<div className="flex gap-1"><Btn size="sm" variant="ghost" onClick={() => setEditing({ kind: "modifier", groupId: g.id, modifier: null })}>+ Option</Btn><Btn size="sm" onClick={() => setEditing({ kind: "group", group: g })}>Edit</Btn><Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleting({ kind: "group", id: g.id, name: g.name })}>Delete</Btn></div>} className={cn(!g.active && "opacity-60")}>
              {g.modifiers.length === 0 ? (
                <p className="px-5 py-4 text-[13px] text-zinc-500">No options yet.</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {g.modifiers.map((m) => (
                    <li key={m.id} className={cn("flex items-center gap-3 px-5 py-2.5 text-[14px]", !m.active && "opacity-60")}>
                      <span className="flex-1 text-zinc-900">{m.name}{m.description && <span className="text-zinc-500"> · {m.description}</span>}{!m.active && <Tag tone="gray" className="ml-2">Off</Tag>}</span>
                      <span className="tabular-nums text-zinc-700">{priceAdjustment(m.priceAdjustment)}</span>
                      <Btn size="sm" variant="ghost" onClick={() => setEditing({ kind: "modifier", groupId: g.id, modifier: m })}>Edit</Btn>
                      <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleting({ kind: "modifier", id: m.id, name: m.name })}>Delete</Btn>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing?.kind === "group" ? (editing.group ? `Edit ${editing.group.name}` : "New modifier group") : editing?.kind === "modifier" ? (editing.modifier ? `Edit ${editing.modifier.name}` : "New option") : ""} width="max-w-md">
        {editing?.kind === "group" && <GroupForm key={editing.group?.id ?? "new"} group={editing.group} onDone={() => { setEditing(null); router.refresh(); }} />}
        {editing?.kind === "modifier" && <ModifierForm key={editing.modifier?.id ?? "new"} groupId={editing.groupId} modifier={editing.modifier} onDone={() => { setEditing(null); router.refresh(); }} />}
      </Drawer>
      <ConfirmDialog open={!!deleting} title={`Delete "${deleting?.name}"?`} body={deleting?.kind === "group" ? "The group and all of its options are removed from every item that uses it." : "This option is removed from the group."} confirmLabel="Delete" loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}

function GroupForm({ group, onDone }: { group: GroupNode | null; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: group?.name ?? "", description: group?.description ?? "", required: group?.required ?? false, minSelections: String(group?.minSelections ?? 0), maxSelections: String(group?.maxSelections ?? 1), active: group?.active ?? true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveModifierGroup({ ...f, id: group?.id });
    setBusy(false);
    if (res.ok) {
      toast.success("Group saved", f.name);
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" htmlFor="g-name" error={errors.name} required><Input id="g-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder="Guisado" /></Field>
      <Field label="Description" htmlFor="g-desc" error={errors.description}><Textarea id="g-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Con cualquiera de los siguientes guisados" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min selections" htmlFor="g-min" error={errors.minSelections}><Input id="g-min" type="number" min={0} max={20} value={f.minSelections} onChange={(e) => setF({ ...f, minSelections: e.target.value })} /></Field>
        <Field label="Max selections" htmlFor="g-max" error={errors.maxSelections}><Input id="g-max" type="number" min={1} max={20} value={f.maxSelections} onChange={(e) => setF({ ...f, maxSelections: e.target.value })} /></Field>
      </div>
      <Toggle checked={f.required} onChange={(v) => setF({ ...f, required: v })} label="Required" description="The guest must choose from this group" />
      <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" />
      <div className="flex justify-end gap-2 pt-2"><Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn><Btn type="submit" variant="primary" loading={busy}>Save</Btn></div>
    </form>
  );
}

function ModifierForm({ groupId, modifier, onDone }: { groupId: number; modifier: Modifier | null; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: modifier?.name ?? "", description: modifier?.description ?? "", priceAdjustment: centsToInput(modifier?.priceAdjustment ?? 0), active: modifier?.active ?? true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveModifier({ ...f, id: modifier?.id, groupId });
    setBusy(false);
    if (res.ok) {
      toast.success("Option saved", f.name);
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" htmlFor="m-name" error={errors.name} required><Input id="m-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder="Mole" /></Field>
      <Field label="Description" htmlFor="m-desc" error={errors.description}><Input id="m-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Price adjustment ($)" htmlFor="m-price" error={errors.priceAdjustment} hint="0 = included; e.g. 1.05 adds $1.05"><Input id="m-price" inputMode="decimal" value={f.priceAdjustment} onChange={(e) => setF({ ...f, priceAdjustment: e.target.value })} /></Field>
      <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" />
      <div className="flex justify-end gap-2 pt-2"><Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn><Btn type="submit" variant="primary" loading={busy}>Save</Btn></div>
    </form>
  );
}
