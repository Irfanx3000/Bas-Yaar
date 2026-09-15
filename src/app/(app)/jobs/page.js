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

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useJobsData } from "@/hooks/useJobsData";
import { jobHref } from "@/lib/jobUrl";
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          /* useJobsData's handleSearch destructures { keyword, location } —
             unlike useSavedJobs/useJobAlerts, which take a bare string. Passing
             the string here made both fields undefined, so every search sent an
             empty term and silently reset the list. */
          handleSearch({ keyword: query });
        }}
        className="mt-3 flex gap-2"
      >
        <label className="flex min-h-[50px] flex-1 items-center gap-2 rounded-[12px] border border-line-input bg-surface px-4">
          <Icon name="search" size={14} className="shrink-0 text-hint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by job title, skills…"
            aria-label="Search jobs"
            className="w-full bg-transparent text-md text-heading outline-none focus-visible:outline-none placeholder:text-hint"
          />
        </label>
        <Button type="submit">Search</Button>
      </form>

      {appliedFilterChips?.length ? (
        <div className="mt-3 flex flex-wrap gap-[5px]">
          {appliedFilterChips.map((chip) => (
            <Chip key={chip.value ?? chip} onRemove={() => removeFilter(chip)}>
              {chip.label ?? chip.value ?? chip}
            </Chip>
          ))}
        </div>
      ) : null}

      <div className="mt-4 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-6">
        {/* Persistent rail on desktop, disclosure on mobile — same markup. */}
        <aside className="mb-4 lg:mb-0">
          <details open className="rounded-md border border-line-soft bg-surface p-4 lg:open:block">
            <summary className="cursor-pointer list-none text-md font-bold text-heading lg:pointer-events-none">
              Filters
            </summary>
            <div className="mt-3">{filters}</div>
          </details>
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
