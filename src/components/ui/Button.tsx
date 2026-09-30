import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "light" | "glass" | "dark" | "verde";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-all duration-300 ease-out-expo select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
const variants: Record<Variant, string> = {
  primary: "bg-clay-600 text-cream-50 shadow-[0_8px_24px_-8px_rgb(181_69_27/0.7)] hover:bg-clay-500 hover:shadow-glow",
  secondary: "bg-brown-900 text-cream-50 hover:bg-brown-800",
  ghost: "bg-transparent text-current hover:bg-current/8",
  outline: "border border-current/30 text-current hover:border-current hover:bg-current/5",
  light: "bg-cream-50 text-brown-900 shadow-card hover:bg-white",
  glass: "bg-brown-950/55 text-cream-50 backdrop-blur border border-cream-50/20 hover:bg-brown-950/80 hover:border-cream-50/40",
  dark: "bg-brown-950 text-cream-50 hover:bg-brown-800",
  verde: "bg-verde-500 text-cream-50 hover:bg-verde-400",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[15px]",
  lg: "h-13 px-8 text-base",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode; arrow?: boolean };

export function Arrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("h-4 w-4 transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-1", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function Button({ variant = "primary", size = "md", className, children, arrow, ...rest }: Common & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", className, children, arrow, href, ...rest }: Common & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  const external = typeof href === "string" && /^(https?:|tel:|mailto:)/.test(href);
  const newTab = typeof href === "string" && /^https?:/.test(href);
  if (external) {
    return (
      <a href={href as string} className={cn(base, variants[variant], sizes[size], className)} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {arrow && <Arrow />}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
