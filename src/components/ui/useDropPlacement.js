"use client";

import { useCallback, useEffect, useState } from "react";

/* Decides whether a popup opens below its trigger or flips above.
 *
 * Shared by DatePicker, Select and TopSearch — three components with the same
 * problem, which is why this is a hook rather than three copies. A field near
 * the bottom of the viewport opened a panel that ran off-screen; a form's last
 * field is exactly where that happens most.
 *
 * No positioning library. Floating UI solves the general case — arrows, shifts,
 * virtual reference elements, nested portals — and none of that is in play here.
 * These are three panels anchored to their own trigger with one decision to
 * make, and that decision is a subtraction:
 *
 *     space below < panel height AND more room above  →  flip up
 *
 * `estimatedHeight` rather than a measured one on purpose: measuring means
 * rendering the panel, reading it, then moving it, which is a visible jump. The
 * panels here have known max-heights, so the estimate is exact enough and the
 * panel is placed correctly on its first paint.
 *
 * The measurement is triggered from the OPEN handler, and re-run only from
 * scroll/resize listeners. Nothing calls setState synchronously inside an effect
 * body, which is the pattern React Compiler flags.
 */
export function useDropPlacement(triggerRef, open, estimatedHeight = 320) {
  const [placement, setPlacement] = useState("bottom");

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    /* Only flip when below genuinely cannot fit AND above is roomier. Flipping
       to a space that is also too small just moves the clipping. */
    setPlacement(spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? "top" : "bottom");
  }, [triggerRef, estimatedHeight]);

  useEffect(() => {
    if (!open) return;

    /* `true` captures scrolls on ancestor containers too — the sidebar and the
       filter rail both scroll independently of the window. */
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);

  return { placement, measure };
}

/* Tailwind cannot build a class name from a variable, so both placements are
   written out in full. */
export const dropClass = (placement) =>
  placement === "top" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]";

export default useDropPlacement;
