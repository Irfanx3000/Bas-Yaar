"use client";

/* Jobs — Block C. Driven entirely by `useJobsData`, copied verbatim in Phase 2:
 * ~290 lines of server pagination, debounced filter previews, saved/applied
 * cross-checks and taxonomy loading, none of it rewritten here.
 *
 * The plan's key translation: the app's FilterJobsModal (529 LOC of bottom
 * sheet) becomes a PERSISTENT RAIL from `lg`. On a phone the sheet exists
 * because there is nowhere to put filters; on a desktop there is, and leaving
 * them visible turns the hook's debounced preview count into a live result
 * count — better than the "View 47" button it was written for.
 * Below `lg` the rail collapses into a <details> disclosure rather than a
 * modal: same content, no focus-trap machinery to maintain.
 */

import { Suspense, useState, useId, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useJobsData } from "@/hooks/useJobsData";
import { jobHref } from "@/lib/jobUrl";
import { searchService } from "@/services/search.service";
import { dropClass, useDropPlacement } from "@/components/ui/useDropPlacement";
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Icon,
  JobCard,
  LoadingState,
  Pagination,
  SectionTitle,
} from "@/components/ui";

function FilterGroup({ title, options, selected, onToggle }) {
  if (!options?.length) return null;

  return (
    <div className="border-t border-line-soft pt-3 first:border-0 first:pt-0">
      <p className="mb-2 text-sm font-bold text-heading">{title}</p>
      <div className="flex flex-wrap gap-[5px]">
        {options.map((opt) => {
          const value = opt.value ?? opt.name ?? opt;
          const label = opt.label ?? opt.name ?? opt;
          const active = selected?.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(value)}
              className={`cursor-pointer rounded-round px-3 py-[5px] text-xs font-semibold transition-colors duration-[180ms] ease-standard ${
                active
                  ? "bg-primary text-on-primary"
                  : "bg-primary-tint text-primary-vivid hover:bg-primary-light"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* useSearchParams() opts the tree into client-side rendering, so Next requires a
   Suspense boundary above it or the build fails at prerender. The boundary lives
   in the exported page and the reading component sits under it — the fallback is
   the same skeleton the list uses while fetching, so there is no visible flash
   between the two states. */
export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
          <LoadingState rows={4} className="pt-6" />
        </div>
      }
    >
      <JobsBrowser />
    </Suspense>
  );
}

function JobsBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const {
    jobs,
    resultCount,
    currentPage,
    totalPages,
    appliedFilterChips,
    removeFilter,
    selectedDepartments,
    selectedVesselTypes,
    selectedCategories,
    departmentOptions,
    vesselTypeOptions,
    categoryOptions,
    isLoading,
    error,
    handleRetry,
    handlePageChange,
    toggleBookmark,
    bookmarkedJobs,
    handleSearch,
    applyFilters,
  } = useJobsData(params.get("category") || undefined);

  const [query, setQuery] = useState(params.get("q") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestState, setSuggestState] = useState("idle");
  const [openSuggest, setOpenSuggest] = useState(false);

  const listId = useId();
  const searchRootRef = useRef(null);
  const searchFormRef = useRef(null);
  const { placement } = useDropPlacement(searchFormRef, openSuggest, 416);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestState("idle");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSuggestState("loading");
        const results = await searchService.search(trimmed);
        if (cancelled) return;
        const jobResults = results?.find(g => g.entityType === "jobs")?.results || [];
        setSuggestions(jobResults);
        setSuggestState("done");
      } catch {
        if (!cancelled) setSuggestState("error");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!openSuggest) return;
    const onPointerDown = (e) => {
      if (!searchRootRef.current?.contains(e.target)) setOpenSuggest(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openSuggest]);

  /* The hook owns filter state; this only computes the next selection and hands
     it back through applyFilters, so nothing is duplicated locally. */
  const toggle = (list, value) =>
    list?.includes(value) ? list.filter((v) => v !== value) : [...(list || []), value];

  const setFilter = (key, value) =>
    applyFilters({
      departments: key === "departments" ? toggle(selectedDepartments, value) : selectedDepartments,
      vesselTypes: key === "vesselTypes" ? toggle(selectedVesselTypes, value) : selectedVesselTypes,
      categories: key === "categories" ? toggle(selectedCategories, value) : selectedCategories,
    });

  const filters = (
    <div className="space-y-3">
      <FilterGroup
        title="Category"
        options={categoryOptions}
        selected={selectedCategories}
        onToggle={(v) => setFilter("categories", v)}
      />
      <FilterGroup
        title="Department"
        options={departmentOptions}
        selected={selectedDepartments}
        onToggle={(v) => setFilter("departments", v)}
      />
      <FilterGroup
        title="Vessel type"
        options={vesselTypeOptions}
        selected={selectedVesselTypes}
        onToggle={(v) => setFilter("vesselTypes", v)}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      <SectionTitle
        className="pt-2"
        action={!isLoading && !error ? <span className="text-sm text-body">{resultCount} open</span> : null}
      >
        Jobs
      </SectionTitle>

      <div className="mt-3 relative w-full" ref={searchRootRef}>
        <form
          ref={searchFormRef}
          onSubmit={(e) => {
            e.preventDefault();
            setOpenSuggest(false);
            handleSearch({ keyword: query });
          }}
          className="flex w-full items-center gap-2"
        >
          <div
            className={`flex h-[50px] flex-1 items-center gap-2 rounded-[12px] border bg-surface px-4 transition-[color,box-shadow] duration-[180ms] ease-standard ${
              openSuggest ? "border-primary ring-4 ring-primary/15" : "border-line-input"
            }`}
          >
            <Icon name="search" size={14} className="shrink-0 text-hint" />
            <input
              type="text"
              role="combobox"
              aria-expanded={openSuggest}
              aria-controls={openSuggest ? listId : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenSuggest(true);
              }}
              onFocus={() => setOpenSuggest(true)}
              onKeyDown={(e) => e.key === "Escape" && setOpenSuggest(false)}
              placeholder="Search by job title, skills…"
              aria-label="Search jobs"
              className="w-full min-w-0 bg-transparent text-md text-heading outline-none focus-visible:outline-none placeholder:text-hint"
            />
          </div>

          <div className="lg:hidden z-40 shrink-0">
            <details className="group">
              <summary
                className="inline-flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-[12px] border border-line-input bg-surface text-primary shadow-sm transition-[color,box-shadow] duration-[180ms] ease-standard hover:bg-surface-hover list-none [&::-webkit-details-marker]:hidden"
                aria-label="Filters"
              >
                <Icon name="filter" size={20} />
              </summary>
              <div className="absolute right-0 top-[60px] w-full max-w-[320px] rounded-[12px] border border-line-soft bg-surface p-4 shadow-lg z-50">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-md font-bold text-heading">Filters</h2>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.target.closest("details").removeAttribute("open");
                    }}
                  >
                    Close
                  </button>
                </div>
                {filters}
              </div>
            </details>
          </div>

          <Button 
            type="submit" 
            aria-label="Search"
            className="h-[50px] w-[50px] shrink-0 !px-0 flex items-center justify-center rounded-[12px]"
          >
            <Icon name="search" size={18} />
          </Button>
        </form>

          {openSuggest && query.trim().length >= 2 ? (
            <div
              id={listId}
              className={`scrollbar-thin absolute left-0 z-50 flex max-h-[26rem] w-full flex-col overflow-y-auto rounded-[12px] border border-line-soft bg-surface p-[5px] shadow-lg ${dropClass(placement)}`}
            >
              {suggestState === "loading" ? (
                <p className="animate-pulse px-3 py-4 text-center text-sm text-hint">Searching…</p>
              ) : suggestState === "error" ? (
                <p className="px-3 py-4 text-center text-sm text-danger">Search failed. Try again.</p>
              ) : suggestions.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-hint">No suggestions for “{query.trim()}”.</p>
              ) : (
                <>
                  {suggestions.map((row) => (
                    <button
                      key={`job-${row.id}`}
                      type="button"
                      onClick={() => {
                        setOpenSuggest(false);
                        router.push(jobHref({ id: row.id, title: row.title }));
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xs px-3 py-2 text-left hover:bg-primary-light"
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
                </>
              )}
            </div>
          ) : null}
        </div>

      {(selectedDepartments?.length > 0 || selectedVesselTypes?.length > 0 || selectedCategories?.length > 0) ? (
        <div className="mt-3 flex flex-wrap items-center gap-[5px]">
          {appliedFilterChips?.map((chip) => (
            <Chip key={chip.value ?? chip} onRemove={() => removeFilter(chip)}>
              {chip.label ?? chip.value ?? chip}
            </Chip>
          ))}
          <button
            type="button"
            onClick={() => applyFilters({ departments: [], vesselTypes: [], categories: [] })}
            className="ml-2 cursor-pointer text-xs font-semibold text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className="mt-4 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-6">
        <aside className="mb-4 lg:mb-0">
          <div className="hidden rounded-md border border-line-soft bg-surface p-4 lg:block">
            <h2 className="text-md font-bold text-heading">Filters</h2>
            <div className="mt-3">{filters}</div>
          </div>
        </aside>

        <div className="min-w-0">
          {isLoading ? (
            <LoadingState rows={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={handleRetry} />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon="briefcase"
              title="No jobs match those filters"
              message="Try removing a filter or searching for a different rank."
            />
          ) : (
            <div className="grid-cards">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  href={jobHref(job)}
                  saved={!!bookmarkedJobs?.[job.id]}
                  onToggleSave={toggleBookmark}
                />
              ))}
            </div>
          )}

          <Pagination
            className="mt-8"
            page={currentPage}
            totalPages={totalPages}
            onChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
