"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/reservations", label: "Reservations", icon: "M4 5h16v15H4zM4 10h16M8 3v4M16 3v4" },
  {
    href: "/admin/menu",
    label: "Menu",
    icon: "M4 6h16M4 12h16M4 18h10",
    children: [
      { href: "/admin/menu", label: "Items" },
      { href: "/admin/menu/categories", label: "Categories" },
      { href: "/admin/menu/modifiers", label: "Modifiers" },
    ],
  },
  { href: "/admin/media", label: "Media", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01" },
  { href: "/admin/hours", label: "Hours", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.5h5l.3-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z" },
];

export function Sidebar({ user, pendingCount, attention, brand }: { user: { name: string; email: string }; pendingCount: number; attention: number; brand: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin">
      {NAV.map((item) => {
        const active = isActive(item.href);
        const badge = item.href === "/admin/reservations" ? pendingCount : item.href === "/admin/settings" || item.href === "/admin/hours" ? (item.href === "/admin/settings" ? attention : 0) : 0;
        return (
          <div key={item.href}>
            <Link href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition", active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")} aria-current={active ? "page" : undefined}>
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              <span className="flex-1">{item.label}</span>
              {badge > 0 && <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>{badge}</span>}
            </Link>
            {item.children && active && (
              <div className="ml-4 mt-1 flex flex-col border-l border-zinc-200 pl-3">
                {item.children.map((c) => {
                  const sub = pathname === c.href;
                  return (
                    <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className={cn("rounded-md px-2 py-1.5 text-[13px]", sub ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-900")} aria-current={sub ? "page" : undefined}>
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-zinc-200 px-4 py-3">
      <p className="truncate text-[13px] font-medium text-zinc-800">{user.name}</p>
      <p className="truncate text-[12px] text-zinc-500">{user.email}</p>
      <div className="mt-2 flex gap-3 text-[12px]">
        <Link href="/" target="_blank" className="text-zinc-500 hover:text-zinc-900">View site ↗</Link>
        <form action="/admin/logout" method="post"><button type="submit" className="text-zinc-500 hover:text-zinc-900">Sign out</button></form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Admin</p>
          <p className="mt-1 text-[15px] font-semibold text-zinc-900">{brand}</p>
        </div>
        {nav}
        {footer}
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Admin</p>
          <p className="text-[14px] font-semibold text-zinc-900">{brand}</p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle navigation" className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={open ? "M5 5l10 10M15 5L5 15" : "M3 6h14M3 10h14M3 14h14"} /></svg>
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 top-[61px] z-30 flex flex-col bg-white lg:hidden">
          <div className="py-3">{nav}</div>
          {footer}
        </div>
      )}
    </>
  );
}
