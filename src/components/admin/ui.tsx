import type { ReservationStatus } from "@/db/schema";
import { RESERVATION_STATUS_LABELS, DAY_SHORT } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { onTabListKeyDown } from "@/lib/tabs";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className, padded = true }: { title?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Field({ label, htmlFor, error, hint, required, className, children }: { label: string; htmlFor?: string; error?: string; hint?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-zinc-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? <p className="text-[12px] font-medium text-red-600">{error}</p> : hint ? <p className="text-[12px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

/** Full width unless the caller passes its own w-* class. */
const widthCls = (className?: string) => (/(^|\s)(w-|min-w-|max-w-)/.test(className ?? "") ? "" : "w-full");

export const inputCls = (error?: boolean, className?: string) =>
  cn(
    "h-10 rounded-lg border bg-white px-3 text-[14px] text-zinc-900 placeholder:text-zinc-400 transition focus:outline-none focus:ring-2",
    widthCls(className),
    error ? "border-red-400 focus:ring-red-200" : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200",
  );

export function Input({ error, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input {...rest} className={cn(inputCls(error, className), className)} />;
}
export function Textarea({ error, className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea {...rest} className={cn(inputCls(error, className), "h-auto min-h-[88px] py-2", className)} />;
}
export function Select({ error, className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select {...rest} className={cn(inputCls(error, className), "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 20 20%22 fill=%22none%22 stroke=%22%2371717a%22 stroke-width=%222%22><path d=%22M5 8l5 5 5-5%22/></svg>')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8", className)}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-50")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-zinc-900" : "bg-zinc-300")}
      >
        <span aria-hidden className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
      <span>
        <span className="block text-[14px] font-medium text-zinc-800">{label}</span>
        {description && <span className="block text-[12px] text-zinc-500">{description}</span>}
      </span>
    </label>
  );
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
export function Btn({ variant = "secondary", size = "md", loading, className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md"; loading?: boolean }) {
  const v: Record<BtnVariant, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-700",
    secondary: "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50",
    danger: "bg-red-600 text-white hover:bg-red-500",
    ghost: "text-zinc-700 hover:bg-zinc-100",
    outline: "border border-zinc-300 text-zinc-800 hover:bg-zinc-50",
  };
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50", size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]", v[variant], className)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent", className)} aria-hidden />;
}

const statusTone: Record<ReservationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  completed: "bg-sky-50 text-sky-700 ring-sky-200",
  no_show: "bg-red-50 text-red-700 ring-red-200",
};
export function StatusBadge({ status }: { status: ReservationStatus }) {
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2 text-[12px] font-medium ring-1 ring-inset", statusTone[status])}>{RESERVATION_STATUS_LABELS[status]}</span>;
}

export function Tag({ children, tone = "gray", className }: { children: React.ReactNode; tone?: "gray" | "green" | "amber" | "red" | "blue" | "purple"; className?: string }) {
  const t = {
    gray: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-sky-50 text-sky-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return <span className={cn("inline-flex h-5 items-center rounded px-1.5 text-[11px] font-semibold uppercase tracking-wide", t[tone], className)}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center">
      <p className="text-[15px] font-medium text-zinc-800">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] text-zinc-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DaysPicker({ value, onChange, disabled }: { value: number[]; onChange: (v: number[]) => void; disabled?: boolean }) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days of week">
      {order.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
            className={cn("h-8 w-11 rounded-md border text-[12px] font-semibold transition", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-500", disabled && "opacity-50")}
          >
            {DAY_SHORT[d]}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cn("inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5", className)} role="tablist" onKeyDown={onTabListKeyDown}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} tabIndex={o.value === value ? 0 : -1} onClick={() => onChange(o.value)} className={cn("h-8 rounded-md px-3 text-[13px] font-medium transition", o.value === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const t = { default: "text-zinc-900", good: "text-emerald-700", warn: "text-amber-700", bad: "text-red-700" }[tone ?? "default"];
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("mt-1 text-3xl font-semibold tabular-nums tracking-tight", t)}>{value}</p>
      {hint && <p className="mt-1 text-[12px] text-zinc-500">{hint}</p>}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2 text-[14px] text-zinc-800", disabled && "opacity-50")}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
      {label}
    </label>
  );
}

/** cents → "6.95" for editable money inputs */
export const centsToInput = (c: number | null | undefined) => (c == null ? "" : (c / 100).toFixed(2).replace(/\.00$/, ""));
