"use client";

import { Icon } from "./Icon";

/* Tabs and Pagination — the two ways screens move between slices of the same
 * data. Behaviour modelled on the admin panel's versions, styling entirely the
 * app's.
 */

/* A real tablist, not a row of buttons: arrow keys move between tabs, which is
 * what the role promises a screen reader. Selection stays controlled so the
 * parent owns which tab is active (usually from the URL). */
export function Tabs({ tabs = [], value, onChange, className = "" }) {
  const onKeyDown = (e) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => (t.value ?? t) === value);
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    onChange?.(next.value ?? next);
  };

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={`flex gap-1 overflow-x-auto border-b border-line-soft ${className}`}
    >
      {tabs.map((tab) => {
        const tabValue = tab.value ?? tab;
        const tabLabel = tab.label ?? tab;
        const selected = tabValue === value;

        return (
          <button
            key={tabValue}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange?.(tabValue)}
            className={`shrink-0 cursor-pointer border-b-2 px-4 py-3 text-md font-semibold whitespace-nowrap transition-colors duration-[180ms] ease-standard ${
              selected
                ? "border-primary text-primary"
                : "border-transparent text-body hover:text-heading"
            }`}
          >
            {tabLabel}
            {tab.count != null ? (
              <span className="ml-2 rounded-round bg-primary-tint px-2 py-0.5 text-xs font-bold text-primary-vivid">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* Windowed page numbers so a 40-page list does not render 40 buttons. Always
 * shows first and last, the current page and its neighbours, with gaps between. */
const pageWindow = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap", p] : [p]));
};

export function Pagination({ page = 1, totalPages = 1, onChange, className = "" }) {
  if (totalPages <= 1) return null;

  const step = (n) => () => onChange?.(Math.min(Math.max(n, 1), totalPages));
  const arrow =
    "inline-flex size-10 cursor-pointer items-center justify-center rounded-md border border-line-input text-body disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-[5px] ${className}`}>
      <button type="button" onClick={step(page - 1)} disabled={page <= 1} aria-label="Previous page" className={arrow}>
        <Icon name="chevron-left" size={14} />
      </button>

      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-hint">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={step(p)}
            aria-current={p === page ? "page" : undefined}
            className={`size-10 cursor-pointer rounded-md text-md font-semibold ${
              p === page
                ? "bg-gradient-primary text-on-primary shadow-sm"
                : "border border-line-input text-body hover:bg-primary-light"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={step(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={arrow}
      >
        <Icon name="chevron-right" size={14} />
      </button>
    </nav>
  );
}
