"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { cn } from "@/lib/cn";

/**
 * Word-by-word rise reveal. Each word is masked by an overflow-hidden span so it
 * slides up from beneath its own baseline. `lines` renders each entry on its own line.
 */
export function SplitText({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.045,
  duration = 0.9,
  as: Tag = "h1",
  animate = true,
}: {
  lines: Array<{ text: string; className?: string }>;
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** false = whileInView, true = animate on mount */
  animate?: boolean;
}) {
  let wordIndex = 0;
  const M = motion[Tag] as typeof motion.h1;

  const trigger = animate ? { animate: "show" as const } : { whileInView: "show" as const, viewport: { once: true, amount: 0.5 } };

  return (
    <M className={className} initial="hidden" {...trigger} aria-label={lines.map((l) => l.text).join(" ")}>
      {lines.map((l, li) => (
        <span key={li} className={cn("block", lineClassName, l.className)} aria-hidden>
          {li > 0 && " "}
          {l.text.split(" ").map((word, wi) => {
            const i = wordIndex++;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block will-change-transform"
                  variants={{
                    hidden: { y: "110%", rotate: 3 },
                    show: { y: 0, rotate: 0, transition: { duration, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  {word}
                </motion.span>
                {wi < l.text.split(" ").length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </M>
  );
}
