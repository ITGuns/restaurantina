"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import type { ActionResult } from "@/actions/types";
import { Btn, Field, Input } from "@/components/admin/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state && !state.ok && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{state.error}</p>}
      <Field label="Email" htmlFor="email" required><Input id="email" name="email" type="email" autoComplete="username" required autoFocus /></Field>
      <Field label="Password" htmlFor="password" required><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
      <Btn type="submit" variant="primary" className="w-full" loading={pending}>Sign in</Btn>
    </form>
  );
}
