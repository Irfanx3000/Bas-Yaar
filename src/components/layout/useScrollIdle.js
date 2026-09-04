"use client";

import { useEffect, useRef, useState } from "react";

/* True while the page is actively scrolling, false once it has settled.
 *
 * Drives the top bar hiding out of the way during a scroll and returning when
 * the user stops. No library: a passive scroll listener plus a settle timer.
 *
 * `scrollend` would be the exact event for this, but Safari still does not fire
 * it, so the timer is the portable answer rather than a progressive-enhancement
 * branch that behaves differently per browser.
 *
 * Two guards keep this from being an accessibility problem:
 *   · it never engages under prefers-reduced-motion
 *   · the caller must not hide a bar that holds focus — a keyboard user
 *     tabbing through the header scrolls the page, and having the thing they
 *     are inside vanish is disorienting. AppShell checks that.
 */
export function useScrollIdle({ settleMs = 220, minScrollY = 24 } = {}) {
  const [scrolling, setScrolling] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      // Near the top there is nothing to reclaim, so leave the bar alone —
      // otherwise it flickers on the tiny scrolls that happen when a page loads.
      if (window.scrollY < minScrollY) {
        setScrolling(false);
        clearTimeout(timer.current);
        return;
      }

      setScrolling(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setScrolling(false), settleMs);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer.current);
    };
  }, [settleMs, minScrollY]);

  return scrolling;
}

export default useScrollIdle;
