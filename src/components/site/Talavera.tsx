import { cn } from "@/lib/cn";

/** Round so server and client render byte-identical SVG attributes (avoids hydration drift). */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Talavera-inspired ornaments: a decorative ring for arch/plate images, a tile
 * divider, a single floating tile and a small flourish. Used sparingly as accents,
 * never as wallpaper.
 */
export function TalaveraRing({ className, spin = true }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={cn("pointer-events-none", spin && "animate-spin-slow motion-reduce:animate-none", className)}>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#1f3a93" strokeWidth="1.5" strokeDasharray="2 6" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#2e5e4e" strokeWidth="3" strokeDasharray="14 10" strokeLinecap="round" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#d9a21b" strokeWidth="1.5" strokeDasharray="1 9" strokeLinecap="round" />
      {Array.from({ length: 12 }).map((_, i) => (
        <circle key={i} cx={r2(100 + 96 * Math.cos((i * Math.PI) / 6))} cy={r2(100 + 96 * Math.sin((i * Math.PI) / 6))} r="2.4" fill="#b5451b" />
      ))}
    </svg>
  );
}

export function TalaveraTile({ className, color = "azul" }: { className?: string; color?: "azul" | "verde" | "clay" | "mostaza" }) {
  const c = { azul: "#1f3a93", verde: "#2e5e4e", clay: "#b5451b", mostaza: "#d9a21b" }[color];
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("pointer-events-none", className)}>
      <rect x="2" y="2" width="60" height="60" rx="8" fill="#fcfaf5" stroke={c} strokeWidth="1.5" />
      <g fill="none" stroke={c} strokeWidth="1.6">
        <path d="M32 12c5 7 5 13 0 20-5-7-5-13 0-20zM32 32c5 7 5 13 0 20-5-7-5-13 0-20zM12 32c7-5 13-5 20 0-7 5-13 5-20 0zM32 32c7-5 13-5 20 0-7 5-13 5-20 0z" />
      </g>
      <g fill="none" stroke="#2e5e4e" strokeWidth="1.4">
        <path d="M18 18c7 1 12 6 13 13-7-1-12-6-13-13zM46 18c-1 7-6 12-13 13 1-7 6-12 13-13zM18 46c1-7 6-12 13-13-1 7-6 12-13 13zM46 46c-7-1-12-6-13-13 7 1 12 6 13 13z" />
      </g>
      <circle cx="32" cy="32" r="3" fill="#d9a21b" />
      <circle cx="8" cy="8" r="1.8" fill="#b5451b" />
      <circle cx="56" cy="8" r="1.8" fill="#b5451b" />
      <circle cx="8" cy="56" r="1.8" fill="#b5451b" />
      <circle cx="56" cy="56" r="1.8" fill="#b5451b" />
    </svg>
  );
}

/** A thin strip of alternating tile motifs, used between sections. */
export function TalaveraDivider({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const stroke = tone === "light" ? "#1f3a93" : "#fcfaf5";
  const leaf = tone === "light" ? "#2e5e4e" : "#8dbfa9";
  return (
    <div className={cn("w-full overflow-hidden", className)} aria-hidden>
      <svg width="100%" height="18" preserveAspectRatio="none">
        <defs>
          <pattern id={`tv-${tone}`} width="36" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 2l7 7-7 7-7-7z" fill="none" stroke={stroke} strokeWidth="1.2" />
            <circle cx="18" cy="9" r="1.6" fill="#d9a21b" />
            <path d="M2 9c3-3 6-3 9 0-3 3-6 3-9 0zM25 9c3-3 6-3 9 0-3 3-6 3-9 0z" fill="none" stroke={leaf} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="18" fill={`url(#tv-${tone})`} />
      </svg>
    </div>
  );
}

/** ── ◆ ── centred ornament for section headers. */
export function Flourish({ className, tone = "clay" }: { className?: string; tone?: "clay" | "cream" | "mostaza" }) {
  const c = { clay: "text-clay-500", cream: "text-cream-200", mostaza: "text-mostaza-500" }[tone];
  return (
    <span className={cn("inline-flex items-center gap-2", c, className)} aria-hidden>
      <span className="h-px w-8 bg-current opacity-60" />
      <svg viewBox="0 0 16 16" className="h-3 w-3"><path d="M8 1l7 7-7 7-7-7z" fill="currentColor" /></svg>
      <span className="h-px w-8 bg-current opacity-60" />
    </span>
  );
}

/** Soft radial "sol" for section backgrounds. */
export function SunRays({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden className={cn("pointer-events-none", className)}>
      {Array.from({ length: 36 }).map((_, i) => (
        <line key={i} x1="200" y1="200" x2={r2(200 + 200 * Math.cos((i * Math.PI) / 18))} y2={r2(200 + 200 * Math.sin((i * Math.PI) / 18))} stroke="currentColor" strokeWidth="1" strokeOpacity={i % 2 ? 0.5 : 0.25} />
      ))}
      <circle cx="200" cy="200" r="60" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}
