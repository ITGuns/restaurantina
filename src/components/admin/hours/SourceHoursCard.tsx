"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applySourceHours, syncBookingWindowsToHours } from "@/actions/hours";
import type { Hours } from "@/db/schema";
import { ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, Tag } from "@/components/admin/ui";
import { DAY_SHORT } from "@/lib/constants";
import { time12 } from "@/lib/format";
import { SOURCE_HOURS, type SourceHoursRow } from "@/lib/source";
import { cn } from "@/lib/cn";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const fmt = (r: SourceHoursRow | undefined) => (!r || r.isClosed || !r.opensAt || !r.closesAt ? "Closed" : `${time12(r.opensAt, { compact: true })}–${time12(r.closesAt, { compact: true })}`);

/**
 * The three conflicting hour sets from the source file, side by side with what
 * the website currently shows. One click applies a set; nothing is chosen for the owner.
 */
export function SourceHoursCard({ current, confirmed }: { current: Hours[]; confirmed: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const currentRows: Record<number, SourceHoursRow> = Object.fromEntries(current.filter((h) => h.category === "store").map((h) => [h.dayOfWeek, { dayOfWeek: h.dayOfWeek, opensAt: h.opensAt, closesAt: h.closesAt, isClosed: h.isClosed }]));
  const matches = (rows: SourceHoursRow[]) => ORDER.every((d) => fmt(rows.find((r) => r.dayOfWeek === d)) === fmt(currentRows[d]));

  const apply = async () => {
    if (!pick) return;
    setBusy(true);
    const res = await applySourceHours(pick, true);
    setBusy(false);
    setPick(null);
    if (res.ok) {
      toast.success("Hours applied", "Restaurant hours and reservation windows updated and marked confirmed.");
      router.refresh();
    } else toast.error(res.error);
  };
  const sync = async () => {
    setBusy(true);
    const res = await syncBookingWindowsToHours();
    setBusy(false);
    if (res.ok) {
      toast.success("Reservation windows rebuilt from the restaurant hours");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <Card title="Which hours are right?" description="restaurantina-data.md lists three different schedules. Compare them with what the website shows now and apply the correct one, or edit the table above by hand." actions={confirmed ? <Tag tone="green">Confirmed</Tag> : <Tag tone="amber">Needs confirmation</Tag>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="py-2 pr-3 font-medium">Source</th>
              {ORDER.map((d) => <th key={d} className="px-2 py-2 font-medium">{DAY_SHORT[d]}</th>)}
              <th className="py-2 pl-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <tr className="bg-zinc-50/80">
              <td className="py-2 pr-3 font-semibold text-zinc-900">Website shows now</td>
              {ORDER.map((d) => <td key={d} className={cn("px-2 py-2 tabular-nums", fmt(currentRows[d]) === "Closed" ? "text-red-600" : "text-zinc-800")}>{fmt(currentRows[d])}</td>)}
              <td />
            </tr>
            {SOURCE_HOURS.map((s) => {
              const same = matches(s.rows);
              return (
                <tr key={s.key}>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-zinc-900">{s.label}{same && <Tag tone="green" className="ml-2">In use</Tag>}</p>
                    <p className="text-[12px] text-zinc-500">{s.description}</p>
                  </td>
                  {ORDER.map((d) => {
                    const v = fmt(s.rows.find((r) => r.dayOfWeek === d));
                    return <td key={d} className={cn("px-2 py-2 tabular-nums", v === "Closed" ? "text-red-600" : "text-zinc-700", v !== fmt(currentRows[d]) && "font-semibold")}>{v}</td>;
                  })}
                  <td className="py-2 pl-3 text-right"><Btn size="sm" variant={same ? "ghost" : "secondary"} disabled={same} onClick={() => setPick(s.key)}>Apply</Btn></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4 text-[13px] text-zinc-600">
        <span>Reservation windows below default to opening time → 60 minutes before close.</span>
        <Btn size="sm" onClick={sync} loading={busy && !pick}>Rebuild reservation windows from hours</Btn>
      </div>
      <ConfirmDialog open={!!pick} title={`Apply the ${SOURCE_HOURS.find((s) => s.key === pick)?.label ?? ""} hours?`} body="The restaurant hours are replaced, reservation windows are rebuilt (opening time to 60 minutes before close) and the hours are marked confirmed. Existing reservations are not changed." confirmLabel="Apply hours" tone="primary" loading={busy} onConfirm={apply} onCancel={() => setPick(null)} />
    </Card>
  );
}
