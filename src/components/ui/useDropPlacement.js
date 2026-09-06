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
 *
 * ── Why the panel is FIXED, not absolute ────────────────────────────────────
 * An absolutely-positioned panel is clipped by any ancestor that scrolls. That
 * used to be nothing, so it did not matter. It matters now: Modal caps its
 * height and scrolls its body, so a Select or DatePicker inside Personal Info or
 * the CV entry form would open a list that got cut off at the container's edge —
 * with no way to reach the options below the cut.
 *
 * Viewport coordinates dodge that entirely: `position: fixed` escapes every
 * ancestor's overflow. The cost is that the panel no longer moves with its
 * trigger for free, which is why the same scroll/resize listeners that decide
 * the flip also refresh the rect — capture:true so ancestor scrolling counts,
 * including the modal body's own.
 */
export function useDropPlacement(triggerRef, open, estimatedHeight = 320) {
  const [placement, setPlacement] = useState("bottom");
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;

    /* Only flip when below genuinely cannot fit AND above is roomier. Flipping
       to a space that is also too small just moves the clipping. */
    setPlacement(spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? "top" : "bottom");
    setRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
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

  return { placement, measure, rect };
}

/* Tailwind cannot build a class name from a variable, so both placements are
   written out in full. Kept for anything still anchoring to its own trigger. */
export const dropClass = (placement) =>
  placement === "top" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]";

/* Inline style for a viewport-anchored panel. Values come from
   getBoundingClientRect, so they are already viewport-relative and go straight
   into a fixed element.

   `left` is clamped to an 8px gutter so a panel wider than its trigger — the
   DatePicker's 19rem calendar under a half-width field — cannot hang off the
   right edge of a phone. Returns null before the first measurement, which is
   the caller's cue to render nothing yet. */
export const dropStyle = (placement, rect, { gap = 8, width } = {}) => {
  if (!rect) return null;

  const panelWidth = width ?? rect.width;
  const maxLeft = Math.max(gap, window.innerWidth - panelWidth - gap);

  return {
    position: "fixed",
    left: Math.min(Math.max(gap, rect.left), maxLeft),
    width: width ? undefined : rect.width,
    ...(placement === "top"
      ? { bottom: window.innerHeight - rect.top + gap }
      : { top: rect.bottom + gap }),
  };
};

export default useDropPlacement;
