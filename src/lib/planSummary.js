"use client";

/* The plan summary handed between /subscription → /subscription/plan → success.
 *
 * Why it is stashed at all: createOrder returns a SERVER-COMPUTED object — the
 * payable amount, prorated credit, wallet credit, the classified scenario, the
 * order id. None of that can be rebuilt from a URL, and calling createOrder
 * again on the next page would open a second order for one purchase.
 *
 * Why it is an external store rather than a useState + useEffect: sessionStorage
 * is browser-only, so reading it during render breaks SSR, and reading it in an
 * effect is a synchronous setState inside an effect — the cascading-render
 * pattern React Compiler flags, and the thing that made this page render its
 * "choose a plan" error for one frame before the summary appeared.
 * `useSyncExternalStore` is the API for exactly this: the server snapshot is
 * null, so SSR and the first client render agree, then the real value is read
 * synchronously on the client.
 *
 * ⚠️ `getSnapshot` MUST return a stable reference. JSON.parse builds a new
 * object every call, and returning a fresh object each time makes React
 * re-render forever. Hence the raw-string cache below: the parsed object is only
 * rebuilt when the stored string actually changes.
 */

const KEY = "crewapply:planSummary";

let cachedRaw;
let cachedValue = null;

const read = () => {
  let raw = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return null; // private mode / storage blocked
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? JSON.parse(raw) : null;
    } catch {
      cachedValue = null; // corrupt stash — treat as absent
    }
  }
  return cachedValue;
};

/* Nothing else in the tab mutates this while a page is mounted — it is written
   on navigation, which unmounts the reader — so the subscription is a no-op. */
const subscribe = () => () => {};

const readOnServer = () => null;

export const planSummaryStore = { read, subscribe, readOnServer };

export function writePlanSummary(summary) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(summary));
    cachedRaw = undefined; // force a re-parse on the next read
  } catch {
    /* the summary page falls back to sending the user back to choose */
  }
}

export function clearPlanSummary() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  cachedRaw = undefined;
  cachedValue = null;
}

/* Format a minor-unit amount for display.
 *
 * The divisor is NOT always 100. INR and USD use 2 decimal places, KWD uses 3,
 * JPY uses 0 — and this data already contains KWD records, so dividing by 100
 * everywhere would show Kuwaiti prices 10x too high. Intl knows each currency's
 * minor units, so it is asked rather than hardcoded. */
export function formatMoney(minorUnits, currency = "INR") {
  if (minorUnits == null) return null;
  const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency });
  const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
  return fmt.format(minorUnits / 10 ** digits);
}
