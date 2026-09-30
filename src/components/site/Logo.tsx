import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The real RestauranTina logo (abuela in an arched window over the wordmark).
 * The PNG is dark brown line-art on an opaque white disc with a transparent
 * outside, so on cream surfaces we multiply-blend it (the disc disappears) and
 * on dark surfaces we show it as a cream badge.
 */
export function Logo({ src, name, size = 64, variant = "multiply", className, priority = false }: { src: string | null; name: string; size?: number; variant?: "multiply" | "badge"; className?: string; priority?: boolean }) {
  if (!src) return <Wordmark name={name} className={className} />;
  if (variant === "badge") {
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-50 shadow-card", className)} style={{ width: size, height: size }}>
        <Image src={src} alt={`${name} logo`} width={size} height={size} priority={priority} className="h-full w-full" />
      </span>
    );
  }
  return <Image src={src} alt={`${name} logo`} width={size} height={size} priority={priority} className={cn("shrink-0 mix-blend-multiply", className)} style={{ width: size, height: size }} />;
}

/** Typographic fallback / companion wordmark. */
export function Wordmark({ name, className, tone = "light" }: { name: string; className?: string; tone?: "light" | "dark" }) {
  const match = name.match(/^(.*?)(Tina)$/i);
  return (
    <span className={cn("font-display font-semibold tracking-[-0.01em]", tone === "light" ? "text-brown-900" : "text-cream-50", className)}>
      {match ? (
        <>
          {match[1]}
          <span className={tone === "light" ? "text-clay-600" : "text-clay-300"}>{match[2]}</span>
        </>
      ) : (
        name
      )}
    </span>
  );
}
