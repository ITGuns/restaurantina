"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "./Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/gallery", label: "Gallery" },
  { href: "/visit", label: "Visit" },
];

export type HeaderProps = {
  name: string;
  logo: string | null;
  status: { isOpen: boolean; label: string; detail: string };
  phone: string;
  phoneHref: string;
  address: string;
  hoursToday: string;
  orderingUrl: string | null;
};

export function StatusDot({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", isOpen ? "text-verde-500" : "text-clay-500", className)}>
      {isOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

export function Header({ name, logo, status, phone, phoneHref, address, hoursToday, orderingUrl }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // While the mobile menu is open, everything behind it is inert and Escape closes it, returning focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const behind = Array.from(document.body.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el !== header && !el.contains(header));
    const previous = behind.map((el) => el.inert);
    behind.forEach((el) => (el.inert = true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      behind.forEach((el, i) => (el.inert = previous[i]));
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
      {/* Utility strip (desktop) */}
      <div
        aria-hidden={scrolled || undefined}
        inert={scrolled}
        className={cn("hidden overflow-hidden bg-brown-900 text-cream-100 transition-[max-height,opacity] duration-500 ease-out-expo lg:block", scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100")}
      >
        <div className="container-site flex h-9 items-center justify-between text-[12.5px] font-medium tracking-[0.04em]">
          <span className="inline-flex items-center gap-2 text-cream-100/85">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-mostaza-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {address}
          </span>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2">
              <StatusDot isOpen={status.isOpen} />
              <span className="text-cream-50">{status.label}</span>
              <span className="text-cream-100/70">· Today {hoursToday}</span>
            </span>
            <a href={phoneHref} className="text-cream-50 transition hover:text-mostaza-300">
              {phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className={cn("transition-[background-color,box-shadow,backdrop-filter] duration-500", scrolled || open ? "bg-cream-100/95 shadow-[0_1px_0_rgb(61_43_31/0.08),0_12px_40px_-24px_rgb(61_43_31/0.5)] backdrop-blur-xl" : "bg-cream-100/90 backdrop-blur-md")}>
        <div className={cn("container-site flex items-center justify-between gap-6 transition-[height] duration-500 ease-out-expo", scrolled ? "h-[62px] md:h-[70px]" : "h-[70px] md:h-[88px]")}>
          <Link href="/" className="relative z-10 flex shrink-0 items-center gap-3" aria-label={`${name} home`}>
            <Logo src={logo} name={name} size={scrolled ? 48 : 60} className="transition-[width,height] duration-500 ease-out-expo" priority />
            <span className="sr-only">{name}</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="group relative py-2 text-[14px] font-semibold uppercase tracking-[0.16em] text-brown-800 transition-colors hover:text-brown-950">
                  {item.label}
                  <span aria-hidden className={cn("absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-clay-500 transition-transform duration-500 ease-out-expo", active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                </Link>
              );
            })}
            {orderingUrl && (
              <a href={orderingUrl} target="_blank" rel="noopener noreferrer" className="group relative py-2 text-[14px] font-semibold uppercase tracking-[0.16em] text-verde-600 transition-colors hover:text-verde-700">
                Order online <span aria-hidden>↗</span>
              </a>
            )}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a href={phoneHref} className="hidden whitespace-nowrap text-[14px] font-semibold text-brown-800 transition hover:text-brown-950 xl:block">
              {phone}
            </a>
            <ButtonLink href="/book" size="sm" className="h-10 px-5" arrow>
              Reserve a Table
            </ButtonLink>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ButtonLink href="/book" size="sm" className="h-9 px-4 text-[13px]">
              Reserve
            </ButtonLink>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-brown-900/15 text-brown-900"
            >
              <span className="relative block h-3.5 w-5">
                <span className={cn("absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-all duration-300", open && "top-[6px] rotate-45")} />
                <span className={cn("absolute left-0 top-[6px] h-0.5 w-5 rounded bg-current transition-all duration-300", open && "opacity-0")} />
                <span className={cn("absolute left-0 top-[12px] h-0.5 w-5 rounded bg-current transition-all duration-300", open && "top-[6px] -rotate-45")} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 top-[70px] z-40 overflow-y-auto bg-brown-950 text-cream-50 lg:hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera-light opacity-[0.06]" />
            <div aria-hidden className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-clay-500/20 blur-3xl" />
            <div className="container-site relative z-[2] flex min-h-full flex-col pb-10 pt-2">
              <nav aria-label="Mobile" className="flex flex-col">
                {[...NAV, ...(orderingUrl ? [{ href: orderingUrl, label: "Order Online ↗" }] : [])].map((item, i) => (
                  <motion.div key={item.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                    {item.href.startsWith("http") ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border-b border-cream-50/10 py-5 font-display text-[2.1rem] leading-none text-cream-50">
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="flex items-center justify-between border-b border-cream-50/10 py-5 font-display text-[2.1rem] leading-none text-cream-50">
                        <span>{item.label}</span>
                        <span className="text-lg text-mostaza-400">→</span>
                      </Link>
                    )}
                  </motion.div>
                ))}
              </nav>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-8 space-y-5">
                <ButtonLink href="/book" size="lg" className="w-full" arrow>
                  Reserve a Table
                </ButtonLink>
                <div className="grid gap-4 rounded-[20px] border border-cream-50/10 p-5 text-[14px] text-cream-100/75">
                  <p className="flex items-center gap-2">
                    <StatusDot isOpen={status.isOpen} />
                    <span className="font-semibold text-cream-50">{status.label}</span>
                    <span>· Today {hoursToday}</span>
                  </p>
                  <p>{address}</p>
                  <a href={phoneHref} className="text-[15px] font-semibold text-cream-50">{phone}</a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
