"use client";

import { useMemo, useState } from "react";
import { addDays, parseDate, toYmd } from "@/lib/format";
import { DAY_SHORT } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function DatePicker({ from, to, closedDates, value, onChange }: { from: string; to: string; closedDates: string[]; value: string | null; onChange: (date: string) => void }) {
  const closed = useMemo(() => new Set(closedDates), [closedDates]);
  const [cursor, setCursor] = useState(() => {
    const base = parseDate(value ?? from);
    return new Date(base.getFullYear(), base.getMonth(), 1, 12);
  });

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toYmd(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1, 12)))];
  while (cells.length % 7) cells.push(null);

  const minMonth = new Date(parseDate(from).getFullYear(), parseDate(from).getMonth(), 1, 12);
  const maxMonth = new Date(parseDate(to).getFullYear(), parseDate(to).getMonth(), 1, 12);
  const canPrev = cursor > minMonth;
  const canNext = cursor < maxMonth;

  return (
    <div className="rounded-[22px] border border-brown-900/10 bg-cream-50 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1, 12))} disabled={!canPrev} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full border border-brown-900/10 text-brown-900 transition hover:bg-brown-900/5 disabled:opacity-30">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6" /></svg>
        </button>
        <h3 className="font-display text-xl text-brown-900" aria-live="polite">{monthLabel}</h3>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12))} disabled={!canNext} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full border border-brown-900/10 text-brown-900 transition hover:bg-brown-900/5 disabled:opacity-30">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4l6 6-6 6" /></svg>
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {DAY_SHORT.map((d) => (
          <span key={d} className="py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brown-500">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const disabled = d < from || d > to || closed.has(d);
          const selected = d === value;
          const isToday = d === from;
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onChange(d)}
              aria-pressed={selected}
              aria-label={parseDate(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + (disabled ? " (unavailable)" : "")}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-full text-[15px] font-medium transition-all",
                selected ? "bg-clay-600 text-cream-50 shadow-glow" : disabled ? "text-brown-900/25 line-through decoration-brown-900/20" : "text-brown-900 hover:bg-brown-900/8",
                isToday && !selected && "ring-1 ring-inset ring-clay-500/60",
              )}
            >
              {Number(d.slice(-2))}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] text-brown-500">Crossed-out dates are unavailable. Bookable through {parseDate(to).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.</p>
    </div>
  );
}

export function quickDates(from: string): { label: string; date: string }[] {
  const out = [{ label: "Today", date: from }, { label: "Tomorrow", date: addDays(from, 1) }];
  const d = parseDate(from);
  const toSat = (6 - d.getDay() + 7) % 7 || 7;
  out.push({ label: "Saturday", date: addDays(from, toSat) });
  const toSun = (7 - d.getDay()) % 7 || 7;
  out.push({ label: "Sunday", date: addDays(from, toSun) });
  return out;
}
