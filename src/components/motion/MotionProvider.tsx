"use client";

import { MotionConfig } from "motion/react";

/**
 * Honours prefers-reduced-motion for every animation in the app: transform and
 * layout animations are skipped while opacity still resolves, so the server and
 * client always render the same markup (no reduced-motion hydration branches).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
