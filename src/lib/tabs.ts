import type { KeyboardEvent } from "react";

/**
 * WAI-ARIA tabs keyboard support for any element with role="tablist".
 * Arrow keys move focus to the previous/next tab and activate it (automatic
 * activation); Home/End jump to the first/last tab. Pair with roving tabindex
 * (tabIndex={selected ? 0 : -1}) on the tabs.
 */
export function onTabListKeyDown(e: KeyboardEvent<HTMLElement>) {
  const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled]):not([aria-disabled="true"])'));
  const current = tabs.indexOf(document.activeElement as HTMLElement);
  if (current < 0 || tabs.length < 2) return;
  let next = -1;
  switch (e.key) {
    case "ArrowRight":
    case "ArrowDown":
      next = (current + 1) % tabs.length;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      next = (current - 1 + tabs.length) % tabs.length;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = tabs.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  tabs[next].focus();
  tabs[next].click();
}
