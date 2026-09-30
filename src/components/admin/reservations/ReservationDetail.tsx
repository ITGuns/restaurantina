"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteReservation, updateReservationStatus } from "@/actions/reservations";
import type { Reservation, ReservationStatus } from "@/db/schema";
import { ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, StatusBadge } from "@/components/admin/ui";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { formatRelative, longDate, time12 } from "@/lib/format";
import { ReservationForm } from "./ReservationForm";

export function ReservationDetail({ reservation: r, occasions }: { reservation: Reservation; occasions: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ReservationStatus | "delete" | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const manageUrl = `${origin}/book/${r.confirmationCode}?t=${r.manageToken}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(manageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  const setStatus = async (status: ReservationStatus) => {
    setBusy(true);
    const res = await updateReservationStatus(r.id, status);
    setBusy(false);
    setConfirm(null);
    if (res.ok) {
      toast.success(`Marked ${RESERVATION_STATUS_LABELS[status].toLowerCase()}`);
      router.refresh();
    } else toast.error(res.error);
  };
  const remove = async () => {
    setBusy(true);
    const res = await deleteReservation(r.id);
    setBusy(false);
    setConfirm(null);
    if (res.ok) {
      toast.success("Reservation deleted");
      router.push("/admin/reservations");
    } else toast.error(res.error);
  };
  const active = r.status === "pending" || r.status === "confirmed";

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-1">
        <Card title="Status" description={`Created ${formatRelative(r.createdAt)} via ${r.source}`}>
          <div className="flex items-center gap-3"><StatusBadge status={r.status} /><span className="text-[13px] text-zinc-500">{longDate(r.date)} · {time12(r.time)}</span></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {r.status === "pending" && <Btn variant="primary" size="sm" onClick={() => setStatus("confirmed")} loading={busy}>Confirm</Btn>}
            {active && <Btn size="sm" onClick={() => setStatus("completed")} disabled={busy}>Complete</Btn>}
            {active && <Btn size="sm" onClick={() => setStatus("no_show")} disabled={busy}>Mark no-show</Btn>}
            {active && <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirm("cancelled")} disabled={busy}>Cancel reservation</Btn>}
            {r.status === "cancelled" && <Btn size="sm" onClick={() => setStatus("confirmed")} disabled={busy}>Reinstate</Btn>}
          </div>
        </Card>
        <Card title="Guest">
          <dl className="space-y-2 text-[14px]">
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Name</dt><dd className="font-medium text-zinc-900">{r.firstName} {r.lastName}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Email</dt><dd className="truncate text-zinc-900"><a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a></dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Phone</dt><dd className="text-zinc-900"><a href={`tel:${r.phone.replace(/\D/g, "")}`} className="hover:underline">{r.phone}</a></dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Party</dt><dd className="text-zinc-900">{r.partySize}</dd></div>
            {r.occasion && <div className="flex justify-between gap-4"><dt className="text-zinc-500">Occasion</dt><dd className="text-zinc-900">{r.occasion}</dd></div>}
            {r.specialRequests && <div><dt className="text-zinc-500">Requests</dt><dd className="mt-1 rounded bg-zinc-50 p-2 text-zinc-900">{r.specialRequests}</dd></div>}
          </dl>
          <div className="mt-4 border-t border-zinc-100 pt-3">
            <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirm("delete")}>Delete record</Btn>
          </div>
        </Card>
        <Card title="Guest link" description="The private link the guest sees on their confirmation. Text or email it if they lost it.">
          <p className="break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-[12px] text-zinc-700" data-testid="manage-link">{manageUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn size="sm" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</Btn>
            <a href={manageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">Open ↗</a>
          </div>
        </Card>
      </div>
      <Card title="Edit reservation" description="Staff edits skip availability checks." className="xl:col-span-2">
        <ReservationForm initial={r} defaultDate={r.date} occasions={occasions} onSaved={() => router.refresh()} onCancel={() => router.push("/admin/reservations")} />
      </Card>
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "delete" ? "Delete this reservation?" : "Cancel this reservation?"}
        body={confirm === "delete" ? "This permanently removes the record. Use Cancel to release the table but keep history." : "The table is released and the guest's link will show it as cancelled."}
        confirmLabel={confirm === "delete" ? "Delete" : "Cancel reservation"}
        loading={busy}
        onConfirm={() => (confirm === "delete" ? remove() : setStatus("cancelled"))}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
