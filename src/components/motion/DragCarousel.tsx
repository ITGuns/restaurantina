"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Horizontal, snap-aligned carousel driven by native scrolling: touch swipe,
 * mouse drag, vertical-wheel → horizontal, arrow buttons, keyboard, plus a
 * progress bar. Children are the slides (<li>). Give the track matching
 * padding and scroll-padding (e.g. "px-5 scroll-px-5") so the first slide
 * snaps flush with the content edge.
 */
export function DragCarousel({
  children,
  className,
  trackClassName,
  ariaLabel = "Carousel",
  tone = "dark",
  edgeFade = true,
}: {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  ariaLabel?: string;
  tone?: "dark" | "light";
  edgeFade?: boolean;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max <= 0 ? 1 : el.scrollLeft / max);
    // Compare the first/last slide against the snap edges rather than raw scrollLeft,
    // so padding and snap alignment can't leave "Previous" enabled at the first slide.
    const box = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const padL = parseFloat(cs.scrollPaddingLeft) || 0;
    const padR = parseFloat(cs.scrollPaddingRight) || 0;
    const first = el.firstElementChild?.getBoundingClientRect();
    const last = el.lastElementChild?.getBoundingClientRect();
    setAtStart(el.scrollLeft <= 2 || !first || first.left >= box.left + padL - 2);
    setAtEnd(el.scrollLeft >= max - 2 || !last || last.right <= box.right - padR + 2);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [measure]);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    if ((dir < 0 && atStart) || (dir > 0 && atEnd)) return;
    const first = el.children[0] as HTMLElement | undefined;
    const gap = parseFloat(getComputedStyle(el).columnGap || "16") || 16;
    const width = first ? first.offsetWidth + gap : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

  // Vertical wheel → horizontal scroll while the pointer is over the track (trackpads already scroll sideways).
  const onWheel = (e: React.WheelEvent) => {
    const el = track.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const max = el.scrollWidth - el.clientWidth;
      const canScroll = (e.deltaY > 0 && el.scrollLeft < max - 1) || (e.deltaY < 0 && el.scrollLeft > 1);
      if (canScroll) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
    track.current.style.scrollSnapType = "none";
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !track.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    track.current.scrollLeft = drag.current.left - dx;
  };
  const endDrag = () => {
    if (!drag.current || !track.current) return;
    const moved = drag.current.moved;
    drag.current = null;
    track.current.style.scrollSnapType = "";
    if (moved) {
      // swallow the click that follows a drag
      const el = track.current;
      const cancel = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      el.addEventListener("click", cancel, { capture: true, once: true });
      setTimeout(() => el.removeEventListener("click", cancel, { capture: true }), 0);
    }
  };

  const dark = tone === "dark";
  // aria-disabled (not the disabled attribute) keeps keyboard focus on the button at either end.
  const btn = cn(
    "flex h-11 w-11 items-center justify-center rounded-full border transition aria-disabled:cursor-default aria-disabled:opacity-30",
    dark ? "border-cream-50/20 text-cream-50 hover:bg-cream-50/10" : "border-brown-900/15 text-brown-900 hover:bg-brown-900/5",
  );

  return (
    <div className={cn("relative", className)} role="region" aria-roledescription="carousel" aria-label={ariaLabel}>
      <ul
        ref={track}
        tabIndex={0}
        aria-label={`${ariaLabel} slides`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay-400 cursor-grab active:cursor-grabbing",
          edgeFade && "mask-fade-x",
          trackClassName,
        )}
      >
        {children}
      </ul>
      <div className="container-site mt-6 flex items-center justify-between gap-6">
        <div className={cn("relative h-px flex-1 overflow-hidden", dark ? "bg-cream-50/15" : "bg-brown-900/15")} aria-hidden>
          <span className="absolute inset-y-0 left-0 w-1/4 min-w-[48px] bg-clay-400 transition-transform duration-200" style={{ transform: `translateX(${progress * 300}%)` }} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Previous" className={btn} aria-disabled={atStart}>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next" className={btn} aria-disabled={atEnd}>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
