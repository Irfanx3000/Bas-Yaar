/* Self-check for the dropdown placement maths.
 *
 * Usage:  node scripts/check-drop-placement.mjs
 *
 * The rule it guards is one line of prose and easy to get wrong in exactly the
 * way it WAS wrong: the old code flipped a panel above its trigger whenever
 * above was ROOMIER than below, without checking the panel fit there. On a
 * phone in an in-app browser that put the DatePicker's calendar head above
 * y=0 — month/year dropdowns and prev/next arrows off-screen, unreachable,
 * because nothing scrolls the window above its own top.
 *
 * No test framework: node's own assert, the same way extract-icons.mjs is plain
 * node. The interesting case is the invariant sweep at the bottom, which asserts
 * the one property that actually matters on every device — the panel is inside
 * the viewport — across every viewport height and field position, rather than
 * trusting three hand-picked examples.
 */

import assert from "node:assert/strict";
import { dropStyle, pickPlacement } from "../src/components/ui/useDropPlacement.js";

const GAP = 8;

/* dropStyle reads window.innerWidth for the horizontal clamp. */
globalThis.window = { innerWidth: 412, innerHeight: 0 };

const field = (top, height = 50) => ({ top, bottom: top + height, left: 15, width: 382 });
const measured = (rect, vh, h) => ({ ...rect, vh, h });

/* Vertical extent the browser will actually paint, derived from the style the
   same way CSS resolves it: `top` grows downward, `bottom` grows upward. */
const extent = (style) =>
  style.top != null
    ? { top: style.top, bottom: style.top + style.maxHeight }
    : { top: window.innerHeight - style.bottom - style.maxHeight, bottom: window.innerHeight - style.bottom };

/* ── 1. Room below: anchored under the trigger, full design height ─────────── */
{
  const vh = 900, h = 360, r = field(100);
  assert.equal(pickPlacement(r, vh, h), "bottom");

  window.innerHeight = vh;
  const s = dropStyle("bottom", measured(r, vh, h), { width: 304 });
  assert.equal(s.top, r.bottom + GAP);
  assert.equal(s.maxHeight, h, "a fitting panel must not be shortened");
}

/* ── 2. The regression: no room below, and not enough above either ─────────── */
{
  /* The reported case — 715px viewport, DOB field mid-form. 310px below, 355px
     above, a 360px calendar. The old rule said "above is roomier" and flipped
     into a space 13px too small. */
  const vh = 715, h = 360, r = field(355);
  assert.equal(vh - r.bottom < h, true, "premise: below really does not fit");
  assert.equal(r.top > vh - r.bottom, true, "premise: above IS roomier — the old rule's trap");
  assert.equal(pickPlacement(r, vh, h), "center", "roomier is not the same as big enough");

  window.innerHeight = vh;
  const { top, bottom } = extent(dropStyle("center", measured(r, vh, h), { width: 304 }));
  assert.ok(top >= GAP, `head clipped at ${top}`);
  assert.ok(bottom <= vh - GAP, `foot clipped at ${bottom}`);
}

/* ── 3. A genuine flip still happens when above really fits ────────────────── */
{
  const vh = 900, h = 360, r = field(700);
  assert.equal(pickPlacement(r, vh, h), "top");

  window.innerHeight = vh;
  const s = dropStyle("top", measured(r, vh, h), { width: 304 });
  assert.equal(s.maxHeight, h, "a fitting flip must not be shortened");
  assert.equal(extent(s).bottom, r.top - GAP, "panel sits just above the trigger");
}

/* ── 4. Viewport shorter than the panel: scroll, never clip ────────────────── */
{
  const vh = 320, h = 360, r = field(150); // phone in landscape
  assert.equal(pickPlacement(r, vh, h), "center");

  window.innerHeight = vh;
  const s = dropStyle("center", measured(r, vh, h), { width: 304 });
  assert.equal(s.maxHeight, vh - GAP * 2, "must shrink to the viewport, and scroll inside");
  assert.equal(extent(s).top, GAP);
}

/* ── 5. Horizontal: a panel wider than its trigger stays on screen ─────────── */
{
  const vh = 900, h = 360;
  const narrow = { top: 100, bottom: 150, left: 250, width: 140 }; // right-hand half-width field
  window.innerHeight = vh;

  const s = dropStyle("bottom", measured(narrow, vh, h), { width: 304 });
  assert.ok(s.left >= GAP, "left gutter");
  assert.ok(s.left + 304 <= window.innerWidth - GAP, "right gutter");
}

/* ── 6. Invariant sweep — the property that matters on every device ────────── */
{
  const widths = [320, 360, 412, 768, 1440];
  let checked = 0;

  for (const vw of widths) {
    for (let vh = 260; vh <= 1000; vh += 20) {
      for (const h of [266, 360, 416]) {
        /* Every field position where the trigger is itself on screen. Once the
           trigger scrolls out of view the panel is meant to follow it out. */
        for (let top = 0; top + 50 <= vh; top += 10) {
          window.innerWidth = vw;
          window.innerHeight = vh;

          const r = field(top);
          const rect = measured(r, vh, h);
          const placement = pickPlacement(r, vh, h);
          const s = dropStyle(placement, rect, { width: 304 });
          const { top: t, bottom: b } = extent(s);

          assert.ok(t >= GAP - 0.5, `${vw}x${vh} h=${h} top=${top} ${placement}: head at ${t}`);
          assert.ok(b <= vh - GAP + 0.5, `${vw}x${vh} h=${h} top=${top} ${placement}: foot at ${b}`);
          assert.ok(s.maxHeight <= h, "never stretched past its design height");
          assert.ok(s.left >= GAP && s.left + 304 <= Math.max(vw - GAP, GAP + 304), "horizontal gutters");
          checked++;
        }
      }
    }
  }
  console.log(`invariant sweep: ${checked} layouts, all inside the viewport`);
}

console.log("drop placement: all checks passed");
