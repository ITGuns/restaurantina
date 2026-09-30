"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Persistent bottom bar on phones/tablets: the guest is always one tap from booking. */
export function MobileCta({ phoneHref }: { phoneHref: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/book")) return null;
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-40 lg:hidden", "border-t border-brown-900/10 bg-cream-100/92 backdrop-blur-xl", "pb-[max(env(safe-area-inset-bottom),12px)] pt-3")}>
      <div className="container-site flex items-center gap-3">
        <a href={phoneHref} aria-label="Call the restaurant" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brown-900/15 text-brown-900">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2z" />
          </svg>
        </a>
        <Link href="/menu" className="flex h-12 flex-1 items-center justify-center rounded-full border border-brown-900/15 text-[15px] font-semibold text-brown-900">
          Menu
        </Link>
        <Link href="/book" className="flex h-12 flex-[1.4] items-center justify-center rounded-full bg-clay-600 text-[15px] font-semibold text-cream-50 shadow-[0_8px_24px_-8px_rgb(181_69_27/0.8)]">
          Reserve a Table
        </Link>
      </div>
    </div>
  );
}
