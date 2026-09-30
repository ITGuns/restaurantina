"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/** true on mouse/trackpad devices without reduced-motion — gate cursor-driven effects on this. */
export function useFinePointer(): boolean {
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine && !reduce;
}
