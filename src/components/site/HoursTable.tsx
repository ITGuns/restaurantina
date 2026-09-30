import type { Hours, HoursCategory } from "@/db/schema";
import { summarizeHours } from "@/lib/availability";
import { DAY_SHORT } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function HoursTable({ hours, category = "store", className, todayDow, tone = "dark" }: { hours: Hours[]; category?: HoursCategory; className?: string; todayDow?: number; tone?: "light" | "dark" }) {
  const rows = summarizeHours(hours, category);
  const dark = tone === "dark";
  return (
    <dl className={cn("divide-y", dark ? "divide-cream-50/10" : "divide-brown-900/10", className)}>
      {rows.map((r) => {
        const isToday = todayDow != null && r.days.split(" – ").length === 1 && r.days === DAY_SHORT[todayDow];
        return (
          <div key={r.days} className={cn("flex items-baseline justify-between gap-6 py-2.5", isToday && "font-semibold")}>
            <dt className={cn("text-[15px]", dark ? "text-cream-100/80" : "text-brown-700")}>{r.days}</dt>
            <dd className={cn("font-display text-[17px] tabular-nums", r.hours === "Closed" ? "text-clay-400" : dark ? "text-cream-50" : "text-brown-900")}>{r.hours}</dd>
          </div>
        );
      })}
    </dl>
  );
}
