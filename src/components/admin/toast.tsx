"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Toast = { id: number; title: string; description?: string; tone: "success" | "error" | "info" };
type Ctx = { toast: (t: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] }) => void; success: (title: string, description?: string) => void; error: (title: string, description?: string) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((t: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] }) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, tone: t.tone ?? "info", title: t.title, description: t.description }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4200);
  }, []);
  const value = useMemo<Ctx>(
    () => ({ toast, success: (title, description) => toast({ title, description, tone: "success" }), error: (title, description) => toast({ title, description, tone: "error" }) }),
    [toast],
  );
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" role="status">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "pointer-events-auto rounded-lg border bg-white px-4 py-3 shadow-lg",
                t.tone === "success" ? "border-emerald-200" : t.tone === "error" ? "border-red-200" : "border-zinc-200",
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", t.tone === "success" ? "bg-emerald-500" : t.tone === "error" ? "bg-red-500" : "bg-zinc-400")} />
                <div>
                  <p className="text-[14px] font-medium text-zinc-900">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[13px] text-zinc-500">{t.description}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
