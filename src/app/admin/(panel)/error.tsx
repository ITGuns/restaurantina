"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-lg font-semibold text-red-800">We couldn&apos;t load this page</h1>
      <p className="mt-2 text-[14px] text-red-700">The database may be unreachable. Try again in a moment; if it keeps happening, check the DATABASE_URL on Vercel.</p>
      <button type="button" onClick={reset} className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-[14px] font-medium text-white">
        Try again
      </button>
      {error.digest && <p className="mt-3 text-[11px] text-red-600/70">Reference: {error.digest}</p>}
    </div>
  );
}
