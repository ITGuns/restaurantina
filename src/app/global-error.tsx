"use client";

import { FALLBACK_CONTACT as C } from "@/lib/fallback";

/** Last-resort boundary for errors in the root layout itself. Must render its own <html>/<body>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const tel = `tel:+1${C.phone.replace(/\D/g, "")}`;
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5efe6", color: "#3d2b1f", fontFamily: "ui-sans-serif, system-ui, sans-serif", textAlign: "center", padding: "24px" }}>
        <div>
          <p style={{ letterSpacing: "0.24em", textTransform: "uppercase", fontSize: 12, color: "#b5451b" }}>Something went wrong</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500, fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1, margin: "16px 0" }}>{C.name}</h1>
          <p style={{ opacity: 0.8, maxWidth: 420, margin: "0 auto" }}>Please try again in a moment, or reach us directly.</p>
          <p style={{ marginTop: 24, fontSize: 22 }}>
            <a href={tel} style={{ color: "#3d2b1f", textDecoration: "none" }}>{C.phone}</a>
          </p>
          <p style={{ opacity: 0.8 }}>{C.address}</p>
          <button type="button" onClick={reset} style={{ marginTop: 24, background: "#963a17", color: "#fcfaf5", border: 0, borderRadius: 999, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 24, fontSize: 12, opacity: 0.5 }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
