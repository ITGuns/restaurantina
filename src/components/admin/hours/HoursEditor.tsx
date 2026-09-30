"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveHoursCategory } from "@/actions/hours";
import type { Hours } from "@/db/schema";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, Input } from "@/components/admin/ui";
import { DAY_NAMES } from "@/lib/constants";
import { cn } from "@/lib/cn";

type Row = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean; note: string };
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function toRows(rows: Hours[]): Row[] {
  return ORDER.map((d) => {
    const r = rows.find((h) => h.category === "store" && h.dayOfWeek === d);
    return r ? { dayOfWeek: d, opensAt: r.opensAt ?? "", closesAt: r.closesAt ?? "", isClosed: r.isClosed, note: r.note ?? "" } : { dayOfWeek: d, opensAt: "", closesAt: "", isClosed: true, note: "" };
  });
}

export function HoursEditor({ hours, confirmed }: { hours: Hours[]; confirmed: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(() => toRows(hours));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const update = (i: number, patch: Partial<Row>) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = async () => {
    setBusy(true);
    setErrors({});
    const payload = rows.map((r) => ({ ...r, opensAt: r.opensAt || null, closesAt: r.closesAt || null }));
    const res = await saveHoursCategory("store", payload);
    setBusy(false);
    if (res.ok) {
      toast.success("Restaurant hours saved", "Live on the website now and marked as confirmed.");
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const copyToAll = (i: number) => {
    const src = rows[i];
    setRows(rows.map((r) => ({ ...r, opensAt: src.opensAt, closesAt: src.closesAt, isClosed: src.isClosed })));
  };

  return (
    <Card title="Restaurant hours" description={confirmed ? "Confirmed by the owner. Drives the open/closed indicator, footer, structured data and menu availability." : "Seeded from the old website and NOT yet confirmed. Saving marks them as confirmed."} padded={false} actions={<Btn variant="primary" onClick={save} loading={busy}>Save restaurant hours</Btn>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
            <tr><th className="px-4 py-2 font-medium">Day</th><th className="px-3 py-2 font-medium">Closed</th><th className="px-3 py-2 font-medium">Opens</th><th className="px-3 py-2 font-medium">Closes</th><th className="px-3 py-2 font-medium">Note</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r, i) => (
              <tr key={r.dayOfWeek} className={cn(r.isClosed && "bg-zinc-50/60")}>
                <td className="px-4 py-2 font-medium text-zinc-900">{DAY_NAMES[r.dayOfWeek]}</td>
                <td className="px-3 py-2"><input type="checkbox" checked={r.isClosed} onChange={(e) => update(i, { isClosed: e.target.checked })} className="h-4 w-4 accent-zinc-900" aria-label={`${DAY_NAMES[r.dayOfWeek]} closed`} /></td>
                <td className="px-3 py-2"><Input type="time" value={r.opensAt} onChange={(e) => update(i, { opensAt: e.target.value })} disabled={r.isClosed} className="w-32" error={!!errors[`${r.dayOfWeek}.opensAt`]} aria-label={`${DAY_NAMES[r.dayOfWeek]} opens`} />{errors[`${r.dayOfWeek}.opensAt`] && <p className="text-[11px] text-red-600">{errors[`${r.dayOfWeek}.opensAt`]}</p>}</td>
                <td className="px-3 py-2"><Input type="time" value={r.closesAt} onChange={(e) => update(i, { closesAt: e.target.value })} disabled={r.isClosed} className="w-32" error={!!errors[`${r.dayOfWeek}.closesAt`]} aria-label={`${DAY_NAMES[r.dayOfWeek]} closes`} />{errors[`${r.dayOfWeek}.closesAt`] && <p className="text-[11px] text-red-600">{errors[`${r.dayOfWeek}.closesAt`]}</p>}</td>
                <td className="px-3 py-2"><Input value={r.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Optional" aria-label={`${DAY_NAMES[r.dayOfWeek]} note`} /></td>
                <td className="px-3 py-2 text-right"><Btn size="sm" variant="ghost" onClick={() => copyToAll(i)} title="Copy these times to every day">Copy to all</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
