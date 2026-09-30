"use client";

import { useEffect } from "react";
import { FALLBACK_CONTACT as C } from "@/lib/fallback";

/** Shown when a public page fails to render (e.g. the database is unreachable). Keeps the essentials visible. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const tel = `tel:+1${C.phone.replace(/\D/g, "")}`;
  return (
    <section className="flex min-h-[70svh] flex-col items-center justify-center bg-cream-100 px-6 pb-24 pt-40 text-center text-brown-900">
      <p className="eyebrow text-clay-600">Something went wrong</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.98]">The kitchen is fine, our website hiccupped.</h1>
      <p className="mt-4 max-w-md text-brown-700">Please try again in a moment. You can always reach {C.name} directly.</p>
      <div className="mt-8 grid gap-2 text-[15px]">
        <a href={tel} className="font-display text-2xl text-brown-900 hover:text-clay-600">
          {C.phone}
        </a>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.mapsQuery)}`} target="_blank" rel="noopener noreferrer" className="text-brown-700 hover:text-brown-900">
          {C.address}
        </a>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-clay-600 px-6 py-3 font-semibold text-cream-50 hover:bg-clay-500">
          Try again
        </button>
        <a href="/" className="rounded-full border border-brown-900/20 px-6 py-3 font-semibold text-brown-900 hover:border-brown-900/50">
          Back home
        </a>
      </div>
      {error.digest && <p className="mt-8 text-[12px] text-brown-500">Reference: {error.digest}</p>}
    </section>
  );
}
