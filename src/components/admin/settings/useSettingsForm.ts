"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveRestaurantInfo } from "@/actions/settings";
import { useToast } from "@/components/admin/toast";

/** Shared state + submit for the settings cards; each card saves only its own fields. */
export function useSettingsForm<T extends Record<string, unknown>>(initial: T, successMessage: string, transform?: (f: T) => Record<string, unknown>) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof T>(k: K, v: T[K]) => setF((s) => ({ ...s, [k]: v }));
  const text = (k: keyof T) => ({ id: `s-${String(k)}`, value: String(f[k] ?? ""), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as T[keyof T]), error: !!errors[String(k)] });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const res = await saveRestaurantInfo(transform ? transform(f) : f);
    setBusy(false);
    if (res.ok) {
      toast.success(successMessage);
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };
  return { f, set, text, errors, busy, submit };
}

export const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
