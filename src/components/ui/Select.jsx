"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { dropClass, useDropPlacement } from "./useDropPlacement";

/* A custom listbox, styled to match Input exactly.
 *
 * This replaces an earlier native <select>. Native was the smaller solution and
 * I argued for it — but a native option list is painted by the OS: it cannot be
 * rounded, it cannot use the app's colours, and on Windows it renders with a
 * grey gradient regardless of what CSS says. A styled dropdown was asked for, so
 * the list has to be ours.
 *
 * What that costs, and therefore what this file has to get right — all of it
 * free with <select>, all of it hand-written here:
 *   · ArrowUp/Down/Home/End move an active option without committing it
 *   · Enter/Space commit, Escape cancels and returns focus to the trigger
 *   · typing jumps to the first option starting with those letters
 *   · clicking or tabbing away closes it
 *   · the active option is scrolled into view
 *   · role/aria wiring so a screen reader announces it as a listbox
 *
 * Closed, it is pixel-identical to Input: 50px min-height, 12px radius, the same
 * border states. Open, the list is a 10px-radius panel on shadow-lg.
 */

const TYPEAHEAD_RESET_MS = 500;

const normalise = (opt) =>
  typeof opt === "string" ? { value: opt, label: opt } : opt;

export function Select({
  label,
  error,
  hint,
  options = [],
  placeholder = "Select an option",
  value,
  onChange,
  disabled = false,
  required,
  name,
  id,
  className = "",
  containerClassName = "",
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listId = `${selectId}-list`;
  const messageId = `${selectId}-message`;

  const items = useMemo(() => options.map(normalise), [options]);
  const selectedIndex = items.findIndex((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typeahead = useRef({ text: "", timer: null });

  /* max-h-64 (256px) plus the 5px padding on the panel. */
  const { placement, measure } = useDropPlacement(triggerRef, open, 266);

  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;

  /* Close on any click that lands outside the whole control. `pointerdown`
     rather than `click` so it fires before focus moves. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /* Keep the active option in view when arrowing past the panel's edge. */
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  useEffect(() => () => clearTimeout(typeahead.current.timer), []);

  const openWith = (index) => {
    measure();
    setActiveIndex(index);
    setOpen(true);
  };

  const commit = (index) => {
    const item = items[index];
    if (!item) return;
    onChange?.(item.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const jumpToTyped = (char) => {
    clearTimeout(typeahead.current.timer);
    typeahead.current.text += char.toLowerCase();
    typeahead.current.timer = setTimeout(() => {
      typeahead.current.text = "";
    }, TYPEAHEAD_RESET_MS);

    const match = items.findIndex((o) =>
      o.label.toLowerCase().startsWith(typeahead.current.text),
    );
    if (match >= 0) {
      if (open) setActiveIndex(match);
      else commit(match);
    }
  };

  const onKeyDown = (e) => {
    if (disabled) return;

    // Printable single characters drive type-ahead, exactly as a native select.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== " ") {
      jumpToTyped(e.key);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openWith(selectedIndex >= 0 ? selectedIndex : 0);
        else setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openWith(selectedIndex >= 0 ? selectedIndex : items.length - 1);
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) { e.preventDefault(); setActiveIndex(0); }
        break;
      case "End":
        if (open) { e.preventDefault(); setActiveIndex(items.length - 1); }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) commit(activeIndex);
        else openWith(selectedIndex >= 0 ? selectedIndex : 0);
        break;
      case "Escape":
        if (open) { e.preventDefault(); setOpen(false); }
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const borderColor = error
    ? "border-danger"
    : open
      ? "border-primary"
      : "border-line-input";

  return (
    <div className={`mb-3 ${containerClassName}`} ref={rootRef}>
{label ? (
        <label htmlFor={selectId} className="mb-[5px] block text-sm font-medium text-body">
          {label}
          {required ? <span className="ml-[2px] text-danger" aria-hidden="true">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        <button
          id={selectId}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openWith(selectedIndex >= 0 ? selectedIndex : 0))}
          onKeyDown={onKeyDown}
          className={`flex min-h-[50px] w-full cursor-pointer items-center justify-between gap-2 rounded-[12px] border bg-surface px-4 py-2 text-left text-md transition-[color,box-shadow] duration-[180ms] ease-standard focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${borderColor} ${
            open ? "ring-4 ring-primary/15" : ""
          } ${selected ? "text-heading" : "text-hint"} ${className}`}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <Icon
            name="chevron-down"
            size={14}
            className={`shrink-0 text-hint transition-transform duration-[180ms] ease-standard ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Hidden input so the control participates in normal form submission,
            which is the one thing a <button>-based combobox loses. */}
        {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}

        {open ? (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-labelledby={selectId}
            tabIndex={-1}
            className={`scrollbar-thin absolute z-50 max-h-64 w-full overflow-y-auto overscroll-contain rounded-md border border-line-soft bg-surface p-[5px] shadow-lg ${dropClass(placement)}`}
          >
            {items.length === 0 ? (
              <li className="px-3 py-2 text-md text-hint">No options</li>
            ) : (
              items.map((item, i) => {
                const isSelected = item.value === value;
                const isActive = i === activeIndex;

                return (
                  <li
                    key={item.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(i)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-xs px-3 py-2 text-md ${
                      isActive ? "bg-primary-light" : ""
                    } ${isSelected ? "font-semibold text-primary" : "text-heading"}`}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected ? <Icon name="check" size={12} className="shrink-0" /> : null}
                  </li>
                );
              })
            )}
          </ul>
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

export default Select;
