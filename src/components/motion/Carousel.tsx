"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Snap-scrolling carousel: native touch swipe, arrow buttons, dots, optional autoplay.
 * Children are the slides; size them with `slideClassName`.
 */
export function Carousel({
  children,
  autoplay = 0,
  className,
  slideClassName,
  trackClassName,
  showArrows = true,
  showDots = true,
  tone = "light",
  ariaLabel = "Carousel",
}: {
  children: React.ReactNode;
  autoplay?: number;
  className?: string;
  slideClassName?: string;
  trackClassName?: string;
  showArrows?: boolean;
  showDots?: boolean;
  tone?: "light" | "dark";
  ariaLabel?: string;
}) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const scrollTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const child = el.children[((i % count) + count) % count] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, [count]);

  // track the active slide from scroll position
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const kids = Array.from(el.children) as HTMLElement[];
        const left = el.scrollLeft + el.offsetLeft;
        let best = 0;
        let bestDist = Infinity;
        kids.forEach((k, i) => {
          const d = Math.abs(k.offsetLeft - left);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setIndex(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!autoplay || paused || count < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      scrollTo(atEnd ? 0 : index + 1);
    }, autoplay);
    return () => window.clearInterval(id);
  }, [autoplay, paused, index, count, scrollTo]);

  const dark = tone === "dark";
  const btn = cn(
    "flex h-11 w-11 items-center justify-center rounded-full border transition disabled:opacity-30",
    dark ? "border-cream-50/20 text-cream-50 hover:bg-cream-50/10" : "border-brown-900/15 text-brown-900 hover:bg-brown-900/5",
  );

  return (
    <div
      className={cn("relative", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <ul ref={track} tabIndex={0} aria-label={`${ariaLabel} slides`} className={cn("scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay-400", trackClassName)}>
        {slides.map((s, i) => (
          <li key={i} className={cn("shrink-0 snap-start", slideClassName)} aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
            {s}
          </li>
        ))}
      </ul>
      {(showArrows || showDots) && count > 1 && (
        <div className="mt-6 flex items-center justify-between gap-4">
          {showDots ? (
            <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => scrollTo(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    i === index ? "w-8 bg-clay-500" : dark ? "w-2 bg-cream-50/30 hover:bg-cream-50/60" : "w-2 bg-brown-900/20 hover:bg-brown-900/40",
                  )}
                />
              ))}
            </div>
          ) : (
            <span />
          )}
          {showArrows && (
            <div className="flex gap-2">
              <button type="button" onClick={() => scrollTo(index - 1)} aria-label="Previous slide" className={btn} disabled={index === 0}>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4l-6 6 6 6" />
                </svg>
              </button>
              <button type="button" onClick={() => scrollTo(index + 1)} aria-label="Next slide" className={btn} disabled={index >= count - 1}>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 4l6 6-6 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
