"use client";

import { useState } from "react";
import { changePassword } from "@/actions/auth";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, Field, Input } from "@/components/admin/ui";

export function PasswordForm() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return toast.error("New passwords don't match");
    setBusy(true);
    const res = await changePassword(current, next);
    setBusy(false);
    if (res.ok) {
      toast.success("Password updated");
      setCurrent(""); setNext(""); setConfirm("");
    } else toast.error(res.error);
  };
  return (
    <form onSubmit={submit}>
      <Card title="Change password" description="At least 10 characters." actions={<Btn type="submit" variant="primary" loading={busy}>Update password</Btn>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password" htmlFor="p-cur"><Input id="p-cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></Field>
          <Field label="New password" htmlFor="p-new"><Input id="p-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={10} required /></Field>
          <Field label="Confirm new password" htmlFor="p-conf"><Input id="p-conf" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={10} required /></Field>
        </div>
      </Card>
    </form>
  );
}
