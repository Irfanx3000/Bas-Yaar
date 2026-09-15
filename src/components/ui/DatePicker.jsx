"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { dropStyle, useDropPlacement } from "./useDropPlacement";

/* A real date picker, styled to match Input.
 *
 * Replaces `<input type="date">`, whose calendar is browser chrome and cannot be
 * restyled at all — the same reason Select stopped being a native <select>.
 *
 * Values stay in "YYYY-MM-DD", exactly what the native input emitted, so this is
 * a drop-in swap and the backend contract is untouched.
 *
 * ⚠️ Dates are parsed and formatted from LOCAL components, never through
 * `new Date("2020-01-15")` or `.toISOString()`. That string is parsed as UTC
 * midnight, so anyone west of Greenwich gets the previous day — a date of birth
 * silently off by one. Every conversion here goes through `new Date(y, m, d)`
 * and manual padding for exactly that reason.
 *
 * The header is month AND year dropdowns rather than only arrows. For a date of
 * birth, stepping back thirty years one month at a time is 360 clicks; that is
 * the single thing a DOB picker has to get right, and arrows alone fail it.
 *
 * Month and weekday names come from Intl, so they are locale-correct without a
 * hardcoded table or a date library.
 */

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseISO = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => a && b && toISO(a) === toISO(b);

const MONTHS = Array.from({ length: 12 }, (_, m) =>
  new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2000, m, 1)),
);

/* Week starts Monday, which is what the app's users expect for rosters and
   contracts. Built from Intl so the labels are not hardcoded English. */
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(2024, 0, 1 + i)),
);

/* Six full weeks, always — a fixed 42-cell grid means the popup never changes
   height between months, which would otherwise make it jump as you navigate. */
function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const start = new Date(year, month, 1 - offset);

  return Array.from({ length: 42 }, (_, i) => new Date(year, month, start.getDate() + i));
}

export function DatePicker({
  label,
  value = "",
  onChange,
  min,
  max,
  required,
  error,
  hint,
  placeholder = "DD-MM-YYYY",
  disabled = false,
  id,
  containerClassName = "",
  /* How far back the year dropdown reaches. 80 suits a date of birth; a
     contract date wants far less, so callers narrow it. */
  yearsBack = 80,
  yearsForward = 5,
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  const selected = parseISO(value);
  const minDate = parseISO(min);
  const maxDate = parseISO(max);

  const [open, setOpen] = useState(false);
  /* The visible month. Reset when the popup OPENS rather than synced from an
     effect: opening is an event, so the reset belongs in the handler. Syncing it
     in an effect meant a setState on every open, which is the cascading-render
     pattern the compiler flags. */
  const [view, setView] = useState(() => selected ?? maxDate ?? new Date());

  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  /* ~360px: 6-week grid + header + footer. Known, so no measure-then-move. */
  const { placement, measure, rect } = useDropPlacement(triggerRef, open, 360);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const grid = useMemo(() => buildGrid(view.getFullYear(), view.getMonth()), [view]);

  const years = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const from = minDate ? minDate.getFullYear() : thisYear - yearsBack;
    const to = maxDate ? maxDate.getFullYear() : thisYear + yearsForward;
    return Array.from({ length: to - from + 1 }, (_, i) => to - i); // newest first
  }, [minDate, maxDate, yearsBack, yearsForward]);

  const outOfRange = (d) => {
    const day = startOfDay(d);
    if (minDate && day < startOfDay(minDate)) return true;
    if (maxDate && day > startOfDay(maxDate)) return true;
    return false;
  };

  const commit = (d) => {
    if (outOfRange(d)) return;
    onChange?.(toISO(d));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const shiftView = (months) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + months, 1));

  /* Arrow keys move a day at a time, PageUp/PageDown a month — the same
     bindings the native picker uses, so muscle memory carries over. */
  const onGridKeyDown = (e) => {
    const base = selected ?? view;
    const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];

    if (move) {
      e.preventDefault();
      const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + move);
      if (!outOfRange(next)) {
        onChange?.(toISO(next));
        setView(next);
      }
      return;
    }
    if (e.key === "PageUp") { e.preventDefault(); shiftView(-1); }
    if (e.key === "PageDown") { e.preventDefault(); shiftView(1); }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
  };

  const today = new Date();
  const display = selected
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(selected)
    : "";

  return (
    <div className={`mb-3 ${containerClassName}`} ref={rootRef}>
      {label ? (
        <label htmlFor={fieldId} className="mb-[5px] block text-sm font-medium text-body">
          {label}
          {required ? <span className="ml-[2px] text-danger" aria-hidden="true">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        <button
          id={fieldId}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={error || hint ? messageId : undefined}
          onClick={() => {
            // Reopening should land on the selected month, not wherever the user
            // last browsed to before dismissing.
            if (!open) {
              setView(selected ?? maxDate ?? new Date());
              measure();
            }
            setOpen((v) => !v);
          }}
          className={`flex min-h-[50px] w-full cursor-pointer items-center justify-between gap-2 rounded-[12px] border bg-surface px-4 py-2 text-left text-md transition-[color,box-shadow] duration-[180ms] ease-standard focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-danger" : open ? "border-primary" : "border-line-input"
          } ${open ? "ring-4 ring-primary/15" : ""} ${display ? "text-heading" : "text-hint"}`}
        >
          <span className="truncate">{display || placeholder}</span>
          <Icon name="calendar-alt" size={14} className="shrink-0 text-hint" />
        </button>

        {open ? (
          <div
            role="dialog"
            aria-label={label || "Choose a date"}
            /* Fixed for the same reason as Select, and given an explicit width
               so dropStyle can keep the 19rem calendar inside the viewport when
               the field itself is narrower. */
            style={dropStyle(placement, rect, { width: 304 }) ?? { display: "none" }}
            className="z-50 w-[19rem] max-w-[calc(100vw-1rem)] rounded-md border border-line-soft bg-surface p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftView(-1)}
                aria-label="Previous month"
                className="cursor-pointer rounded-md p-2 text-hint hover:bg-primary-light hover:text-primary"
              >
                <Icon name="chevron-left" size={12} />
              </button>

              {/* Month + year as selects, not just arrows — see the note above. */}
              <select
                aria-label="Month"
                value={view.getMonth()}
                onChange={(e) => setView(new Date(view.getFullYear(), Number(e.target.value), 1))}
                className="min-w-0 flex-1 cursor-pointer rounded-md border border-line-input bg-surface px-2 py-1 text-sm font-semibold text-heading focus-visible:outline-none"
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i}>{name}</option>
                ))}
              </select>

              <select
                aria-label="Year"
                value={view.getFullYear()}
                onChange={(e) => setView(new Date(Number(e.target.value), view.getMonth(), 1))}
                className="scrollbar-thin cursor-pointer rounded-md border border-line-input bg-surface px-2 py-1 text-sm font-semibold text-heading focus-visible:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => shiftView(1)}
                aria-label="Next month"
                className="cursor-pointer rounded-md p-2 text-hint hover:bg-primary-light hover:text-primary"
              >
                <Icon name="chevron-right" size={12} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-[2px]">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1 text-center text-xs font-bold text-hint">
                  {w.slice(0, 2)}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-[2px]" onKeyDown={onGridKeyDown}>
              {grid.map((d) => {
                const inMonth = d.getMonth() === view.getMonth();
                const isSelected = sameDay(d, selected);
                const isToday = sameDay(d, today);
                const blocked = outOfRange(d);

                return (
                  <button
                    key={toISO(d)}
                    type="button"
                    disabled={blocked}
                    aria-pressed={isSelected}
                    aria-label={d.toDateString()}
                    tabIndex={isSelected || (!selected && isToday) ? 0 : -1}
                    onClick={() => commit(d)}
                    className={`flex size-9 items-center justify-center rounded-md text-sm transition-colors duration-[180ms] ease-standard ${
                      blocked
                        ? "cursor-not-allowed text-hint/40"
                        : isSelected
                          ? "bg-gradient-primary cursor-pointer font-bold text-on-primary shadow-sm"
                          : isToday
                            ? "cursor-pointer border border-primary font-bold text-primary"
                            : inMonth
                              ? "cursor-pointer text-heading hover:bg-primary-light"
                              : "cursor-pointer text-hint hover:bg-primary-light"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2">
              <button
                type="button"
                onClick={() => !outOfRange(today) && commit(today)}
                disabled={outOfRange(today)}
                className="cursor-pointer text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-hint"
              >
                Today
              </button>
              {value ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  className="cursor-pointer text-sm font-semibold text-body hover:text-heading"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {error || hint ? (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={`mt-[5px] text-sm ${error ? "text-danger" : "text-hint"}`}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  );
}

export default DatePicker;
