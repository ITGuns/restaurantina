import { cn } from "@/lib/cn";

export function SocialIcon({ name, className }: { name: "instagram" | "facebook" | "tiktok"; className?: string }) {
  const c = cn("shrink-0", className);
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={c} fill="currentColor">
        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={c} fill="currentColor">
      <path d="M16.5 3c.3 2.3 1.8 3.9 4 4.1v3.1c-1.5 0-2.9-.5-4-1.3v6.3c0 3.3-2.7 5.8-6 5.8s-6-2.5-6-5.8 2.7-5.8 6-5.8c.3 0 .6 0 .9.1v3.2a2.8 2.8 0 0 0-.9-.2 2.7 2.7 0 1 0 2.7 2.7V3h3.3z" />
    </svg>
  );
}
