"use client";

import { useCallback, useEffect, useState } from "react";

/* Decides whether a popup opens below its trigger, flips above, or — when
 * neither side can hold it — detaches into the middle of the viewport.
 *
 * Shared by DatePicker, Select and TopSearch — three components with the same
 * problem, which is why this is a hook rather than three copies. A field near
 * the bottom of the viewport opened a panel that ran off-screen; a form's last
 * field is exactly where that happens most.
 *
 * No positioning library. Floating UI solves the general case — arrows, shifts,
 * virtual reference elements, nested portals — and none of that is in play here.
 * These are three panels anchored to their own trigger, and the decision is a
 * pair of subtractions against the space on either side:
 *
 *     fits below       →  bottom
 *     else fits above  →  top
 *     else             →  center
 *
 * That last rung is the one that was missing. The old rule flipped up whenever
 * above was merely ROOMIER than below, without checking the panel actually fit
 * up there — so on a short viewport the 360px calendar flipped into ~340px of
 * space and lost its head: the month/year dropdowns and the prev/next arrows
 * rendered above y=0, unreachable, because nothing scrolls the window above its
 * own top. Clipping at the bottom costs you a footer; clipping at the top costs
 * you the controls AND any way to reach them. Preferring the roomier side is
 * only right when one of the two sides is actually big enough to win.
 *
 * On a phone inside an in-app browser (Instagram, WhatsApp) the extra chrome
 * leaves a mid-form field with too little room on BOTH sides. There is no good
 * anchored answer there, so the panel stops pretending to be anchored and
 * centres itself — which is what a native mobile picker does anyway.
 *
 * `estimatedHeight` rather than a measured one on purpose: measuring means
 * rendering the panel, reading it, then moving it, which is a visible jump. It
 * no longer has to be exact, because every placement also ships a `maxHeight`
 * clamped to the space actually available — an underestimate now costs a
 * scrollbar rather than content drawn off-screen.
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

/* Breathing room between trigger and panel, and between panel and viewport
   edge. Lives here rather than only as dropStyle's default because the fit test
   has to reserve the same pixels the style later spends. */
const GAP = 8;

/* The whole decision, as a pure function — no DOM, so scripts/check-drop-placement.mjs
   can pin it down with plain asserts instead of a headless browser.

   `+ gap * 2` is the gap to the trigger plus the gutter to the viewport edge:
   the same two gaps dropStyle spends. A side that passes this test renders at
   full height, nothing clipped and nothing scrolling. Testing against the bare
   height would hand back a side eight pixels short and call it a fit. */
export const pickPlacement = (rect, vh, estimatedHeight, gap = GAP) => {
  const needed = estimatedHeight + gap * 2;
  if (vh - rect.bottom >= needed) return "bottom";
  if (rect.top >= needed) return "top";
  return "center";
};

export function useDropPlacement(triggerRef, open, estimatedHeight = 320) {
  const [placement, setPlacement] = useState("bottom");
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;

    setPlacement(pickPlacement(r, vh, estimatedHeight));

    /* vh and the height estimate travel WITH the rect, so dropStyle can size the
       panel without every call site passing the same number twice. */
    setRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width, vh, h: estimatedHeight });
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
   written out in full. Kept for anything still anchoring to its own trigger.
   "center" has no absolute-positioned equivalent and falls through to the
   downward class — its only user, TopSearch, lives in the sticky header where
   there is always room below, so it never reaches that branch. */
export const dropClass = (placement) =>
  placement === "top" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]";

/* Inline style for a viewport-anchored panel. Values come from
   getBoundingClientRect, so they are already viewport-relative and go straight
   into a fixed element.

   `left` is clamped to an 8px gutter so a panel wider than its trigger — the
   DatePicker's 19rem calendar under a half-width field — cannot hang off the
   right edge of a phone.

   Every branch returns a `maxHeight` as well as a position. That is what makes
   the height estimate advisory rather than load-bearing: the panel can never
   draw outside the space it was handed, so the worst case is an internal
   scrollbar instead of rows rendered off-screen. It is capped at the panel's own
   design height (`rect.h`) so a roomy desktop viewport does not stretch a list
   that was meant to stop at max-h-64.

   Returns null before the first measurement, which is the caller's cue to
   render nothing yet. */
export const dropStyle = (placement, rect, { gap = GAP, width } = {}) => {
  if (!rect) return null;

  const panelWidth = width ?? rect.width;
  const maxLeft = Math.max(gap, window.innerWidth - panelWidth - gap);
  const fit = (space) => Math.max(0, Math.min(rect.h, space));

  const vertical =
    placement === "top"
      ? { bottom: rect.vh - rect.top + gap, maxHeight: fit(rect.top - gap * 2) }
      : placement === "center"
        ? /* Detached: centred in whatever height there is, and never above the
             top gutter — on a viewport shorter than the panel itself the centred
             offset would go negative and clip the head all over again, which is
             the exact failure this branch exists to end. */
          {
            top: Math.max(gap, (rect.vh - fit(rect.vh - gap * 2)) / 2),
            maxHeight: fit(rect.vh - gap * 2),
          }
        : { top: rect.bottom + gap, maxHeight: fit(rect.vh - rect.bottom - gap * 2) };

  return {
    position: "fixed",
    left: Math.min(Math.max(gap, rect.left), maxLeft),
    width: width ? undefined : rect.width,
    ...vertical,
  };
};

export default useDropPlacement;
