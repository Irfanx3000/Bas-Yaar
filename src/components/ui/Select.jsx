"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { dropStyle, useDropPlacement } from "./useDropPlacement";

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
 * `searchable` is the app's SearchablePickerSheet (country, nationality, state,
 * city): a search box at the top of the open panel, filtered with the sheet's
 * exact relevance ranking. Typing on the closed trigger opens it with those
 * characters already in the box, so a keyboard user never has to click first.
 *
 * Closed, it is pixel-identical to Input: 50px min-height, 12px radius, the same
 * border states. Open, the list is a 10px-radius panel on shadow-lg.
 */

const TYPEAHEAD_RESET_MS = 500;
const LIST_HEIGHT = 266; // max-h-64 (256px) plus the 5px padding on the panel
const SEARCH_HEIGHT = 52;

const normalise = (opt) =>
  typeof opt === "string" ? { value: opt, label: opt } : opt;

/* Labels like "🇮🇳 India" lead with a flag, so matching on the raw label means
   nothing ever "starts with" a letter. Flags are regional-indicator symbols, not
   letters, so stripping every leading non-letter/number is exact. */
const searchText = (label) =>
  String(label).replace(/^[^\p{L}\p{N}]+/u, "").toLowerCase();

/* SearchablePickerSheet's ranking, verbatim in behaviour. Lower tier is better:
     0 exact            "india"                           for "india"
     1 starts with      "India"                           for "indi"
     2 a word starts    "British Indian Ocean Territory"  for "indi"
     3 anywhere         "Argentina"                       for "in"
   Non-matches drop out. Within a tier: shorter first, then A→Z — so "India"
   outranks "Indonesia", and both outrank "British Indian…". */
function rank(items, query) {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const scored = [];
  for (const item of items) {
    const text = searchText(item.label);
    let tier = -1;
    if (text === q) tier = 0;
    else if (text.startsWith(q)) tier = 1;
    else if (text.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(q))) tier = 2;
    else if (text.includes(q)) tier = 3;
    if (tier !== -1) scored.push({ item, tier, len: text.length, text });
  }

  scored.sort((a, b) => a.tier - b.tier || a.len - b.len || a.text.localeCompare(b.text));
  return scored.map((s) => s.item);
}

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
  searchable = false,
  searchPlaceholder = "Search...",
  loading = false,
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listId = `${selectId}-list`;
  const messageId = `${selectId}-message`;

  const items = useMemo(() => options.map(normalise), [options]);
  const selected = items.find((o) => o.value === value) ?? null;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");

  /* Everything that indexes options while open — arrows, Enter, hover,
     scroll-into-view — works on the VISIBLE list, so a filtered view and the
     keyboard can never disagree about which row is "active". */
  const visible = useMemo(() => (searchable ? rank(items, query) : items), [searchable, items, query]);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const typeahead = useRef({ text: "", timer: null });

  const { placement, measure, rect } = useDropPlacement(
    triggerRef,
    open,
    searchable ? LIST_HEIGHT + SEARCH_HEIGHT : LIST_HEIGHT,
  );

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

  /* Focus the search box once the panel exists — the panel only mounts on open. */
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => () => clearTimeout(typeahead.current.timer), []);

  const openWith = (index, initialQuery = "") => {
    measure();
    setQuery(initialQuery);
    setActiveIndex(index);
    setOpen(true);
  };

  const indexOfSelected = () => items.findIndex((o) => o.value === value);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const commit = (index) => {
    const item = visible[index];
    if (!item) return;
    onChange?.(item.value);
    close();
  };

  const onQueryChange = (text) => {
    setQuery(text);
    // A new query is a new list — start at its best match, not a stale index.
    setActiveIndex(0);
    listRef.current?.scrollTo?.({ top: 0 });
  };

  const jumpToTyped = (char) => {
    clearTimeout(typeahead.current.timer);
    typeahead.current.text += char.toLowerCase();
    typeahead.current.timer = setTimeout(() => {
      typeahead.current.text = "";
    }, TYPEAHEAD_RESET_MS);

    const match = items.findIndex((o) => searchText(o.label).startsWith(typeahead.current.text));
    if (match >= 0) {
      if (open) setActiveIndex(match);
      else commit(match);
    }
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    const inSearch = e.target === searchRef.current;
    const printable = e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;

    if (printable && !inSearch) {
      if (searchable) {
        // Open straight into a search for what was typed.
        if (e.key === " " && open) return;
        e.preventDefault();
        if (e.key === " ") openWith(Math.max(indexOfSelected(), 0));
        else openWith(0, e.key);
        return;
      }
      if (e.key !== " ") {
        jumpToTyped(e.key);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openWith(Math.max(indexOfSelected(), 0));
        else setActiveIndex((i) => Math.min(i + 1, visible.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openWith(indexOfSelected() >= 0 ? indexOfSelected() : items.length - 1);
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        // Inside the search box Home/End move the caret, as a text field should.
        if (open && !inSearch) { e.preventDefault(); setActiveIndex(0); }
        break;
      case "End":
        if (open && !inSearch) { e.preventDefault(); setActiveIndex(visible.length - 1); }
        break;
      case "Enter":
        e.preventDefault();
        if (open) commit(activeIndex);
        else openWith(Math.max(indexOfSelected(), 0));
        break;
      case " ":
        if (inSearch) break; // a space is part of the query ("united states")
        e.preventDefault();
        if (open) commit(activeIndex);
        else openWith(Math.max(indexOfSelected(), 0));
        break;
      case "Escape":
        if (open) { e.preventDefault(); close(); }
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

  const emptyText = loading ? "Loading..." : searchable && query.trim() ? "No results found" : "No options";

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
          aria-busy={loading || undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openWith(Math.max(indexOfSelected(), 0)))}
          onKeyDown={onKeyDown}
          className={`flex min-h-[50px] w-full cursor-pointer items-center justify-between gap-2 rounded-[12px] border bg-surface px-4 py-2 text-left text-md transition-[color,box-shadow] duration-[180ms] ease-standard focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${borderColor} ${
            open ? "ring-4 ring-primary/15" : ""
          } ${selected ? "text-heading" : "text-hint"} ${className}`}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          {loading ? (
            <span
              aria-hidden="true"
              className="size-3.5 shrink-0 animate-spin rounded-round border-2 border-hint border-t-transparent"
            />
          ) : (
            <Icon
              name="chevron-down"
              size={14}
              className={`shrink-0 text-hint transition-transform duration-[180ms] ease-standard ${
                open ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {/* Hidden input so the control participates in normal form submission,
            which is the one thing a <button>-based combobox loses. */}
        {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}

        {open ? (
          <div
            /* Fixed, so a modal's scrolling body cannot clip the list. */
            style={dropStyle(placement, rect) ?? { display: "none" }}
            className="z-50 rounded-md border border-line-soft bg-surface shadow-lg"
          >
            {searchable ? (
              <div className="border-b border-line-soft p-[5px]">
                <label className="flex h-10 items-center gap-2 rounded-[10px] bg-canvas-top px-3">
                  <Icon name="search" size={12} className="shrink-0 text-hint" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    aria-controls={listId}
                    aria-activedescendant={visible[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full bg-transparent text-md text-heading outline-none placeholder:text-hint focus-visible:outline-none"
                  />
                </label>
              </div>
            ) : null}

            <ul
              id={listId}
              ref={listRef}
              role="listbox"
              aria-labelledby={selectId}
              tabIndex={-1}
              className="scrollbar-thin max-h-64 overflow-y-auto overscroll-contain p-[5px]"
            >
              {visible.length === 0 ? (
                <li className="px-3 py-2 text-md text-hint">{emptyText}</li>
              ) : (
                visible.map((item, i) => {
                  const isSelected = item.value === value;
                  const isActive = i === activeIndex;

                  return (
                    <li
                      key={item.value}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(i)}
                      /* preventDefault on mousedown keeps focus in the search box,
                         so a click commits without a blur flicker first. */
                      onMouseDown={(e) => e.preventDefault()}
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

export default Select;
