"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { searchService } from "@/services/search.service";
import { dropClass, useDropPlacement } from "@/components/ui/useDropPlacement";

/* Global search in the top bar, modelled on the admin panel's TopNavbar search.
 *
 * What was copied from admin (the behaviour, not a line of its styling):
 *   · a pill that holds icon + input, with the dropdown anchored to it
 *   · a 2-character floor before anything is requested
 *   · results grouped by entity type, each group labelled
 *   · explicit loading / error / empty states rather than a silent blank panel
 *   · `navigable: false` rows render but do not link
 *
 * What is deliberately different: admin animates a collapsed icon into an
 * expanded pill because its navbar is crowded. Here the bar has room, so the
 * pill is always open — an animation that hides a search field is cost without
 * benefit when nothing is competing for the space.
 *
 * The response shape is the same one /search renders:
 *   groups: [{ entityType, count, results: [{ id, title, subtitle, navigable }] }]
 * Only `jobs` has a detail route in this app, so other groups list without
 * links rather than pretending to be clickable.
 */

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

const GROUP_LABEL = {
  jobs: "Jobs",
  applications: "Applications",
  users: "People",
  subscriptions: "Subscriptions",
};

export function TopSearch() {
  const router = useRouter();
  const listId = useId();

  const [term, setTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | error | done
  const [open, setOpen] = useState(false);

  const rootRef = useRef(null);
  const formRef = useRef(null);

  /* max-h 26rem = 416px. */
  const { placement } = useDropPlacement(formRef, open, 416);

  /* Debounced query. The cleanup cancels the pending timer on every keystroke,
     so a fast typist costs one request rather than one per character — and the
     backend's search limiter is 30/min, which a per-keystroke search would
     exhaust in about two words. */
  /* The effect only FETCHES. It sets no state synchronously — "loading" and the
     reset-to-idle both happen in the onChange handler below, because a setState
     that runs on every render pass of an effect is what triggers the cascading
     renders React Compiler flags. Everything here now runs after the debounce,
     inside the timer callback. */
  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < MIN_CHARS) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await searchService.search(trimmed);
        if (cancelled) return;
        setGroups(results || []);
        setState("done");
      } catch {
        if (!cancelled) setState("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const submit = (e) => {
    e?.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const go = (entityType, row) => {
    if (row.navigable === false) return;
    setOpen(false);
    router.push(entityType === "jobs" ? `/jobs/${row.id}` : `/search?q=${encodeURIComponent(term.trim())}`);
  };

  const total = groups.reduce((sum, g) => sum + (g.count ?? g.results?.length ?? 0), 0);
  const tooShort = term.trim().length > 0 && term.trim().length < MIN_CHARS;

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <form
        ref={formRef}
        onSubmit={submit}
        className={`flex min-h-11 w-full items-center gap-2 rounded-[12px] border bg-surface px-4 transition-[color,box-shadow] duration-[180ms] ease-standard ${
          open ? "border-primary ring-4 ring-primary/15" : "border-line-input"
        }`}
      >
        <Icon name="search" size={14} className="shrink-0 text-hint" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label="Search jobs"
          value={term}
          placeholder="Search jobs, ranks, vessels…"
          onChange={(e) => {
            const next = e.target.value;
            setTerm(next);
            setOpen(true);
            /* Status transitions live here, in the event handler, rather than in
               the fetch effect — see the note on that effect. */
            if (next.trim().length < MIN_CHARS) {
              setGroups([]);
              setState("idle");
            } else {
              setState("loading");
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="w-full min-w-0 bg-transparent text-md text-heading outline-none focus-visible:outline-none placeholder:text-hint"
        />
        {term ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setTerm("");
              setGroups([]);
            }}
            className="shrink-0 cursor-pointer p-1 text-hint hover:text-heading"
          >
            <Icon name="times" size={12} />
          </button>
        ) : null}
      </form>

      {open && term.trim() ? (
        <div
          id={listId}
          className={`scrollbar-thin absolute left-0 z-50 flex max-h-[26rem] w-full flex-col overflow-y-auto rounded-md border border-line-soft bg-surface p-[5px] shadow-lg ${dropClass(placement)}`}
        >
          {tooShort ? (
            <p className="px-3 py-4 text-center text-sm text-hint">Keep typing — at least {MIN_CHARS} characters.</p>
          ) : state === "loading" ? (
            <p className="animate-pulse px-3 py-4 text-center text-sm text-hint">Searching…</p>
          ) : state === "error" ? (
            <p className="px-3 py-4 text-center text-sm text-danger">Search failed. Try again.</p>
          ) : total === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-hint">No results for “{term.trim()}”.</p>
          ) : (
            <>
              {groups
                .filter((g) => g.results?.length)
                .map((group) => (
                  <div key={group.entityType}>
                    <p className="px-3 pt-2 pb-1 text-xs font-bold tracking-wide text-hint">
                      {GROUP_LABEL[group.entityType] ?? group.entityType}
                    </p>
                    {group.results.map((row) => (
                      <button
                        key={`${group.entityType}-${row.id}`}
                        type="button"
                        onClick={() => go(group.entityType, row)}
                        disabled={row.navigable === false}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-xs px-3 py-2 text-left hover:bg-primary-light disabled:cursor-default disabled:opacity-60"
                      >
                        <Icon name="briefcase" size={12} className="shrink-0 text-hint" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-md text-heading">{row.title}</span>
                          {row.subtitle ? (
                            <span className="block truncate text-sm text-body">{row.subtitle}</span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}

              <button
                type="button"
                onClick={submit}
                className="mt-1 cursor-pointer border-t border-line-soft px-3 py-2 text-center text-sm font-semibold text-primary hover:underline"
              >
                See all results for “{term.trim()}”
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default TopSearch;
