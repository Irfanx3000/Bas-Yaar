"use client";

/* Saved jobs — Block C. `useSavedJobs` filters and paginates entirely client-side
 * (the saved list is already in memory via SavedJobsContext), so this is the same
 * grid as /jobs with a different source and a remove action instead of a save.
 *
 * Hook contract, read first:
 *   jobs · matchingJobs · totalCount · searchKeyword · currentPage · totalPages
 *   isLoading · appliedFilterChips · removeFilter · applyFilters · handleSearch
 *   handleRemoveJob · handleRefresh · setCurrentPage
 * Note it exposes setCurrentPage, NOT handlePageChange like useJobsData does.
 */

import { useState } from "react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  JobCard,
  LoadingState,
  Pagination,
  SectionTitle,
} from "@/components/ui";
import Link from "next/link";

export default function SavedJobsPage() {
  const {
    jobs,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    appliedFilterChips,
    removeFilter,
    handleSearch,
    handleRemoveJob,
    setCurrentPage,
  } = useSavedJobs();

  const [query, setQuery] = useState("");

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      <SectionTitle
        className="pt-2"
        action={!isLoading ? <span className="text-sm text-body">{totalCount} saved</span> : null}
      >
        Saved jobs
      </SectionTitle>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="mt-3 flex gap-2"
      >
        <label className="flex min-h-[50px] flex-1 items-center gap-2 rounded-[12px] border border-line-input bg-surface px-4">
          <Icon name="search" size={14} className="shrink-0 text-hint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your saved jobs"
            aria-label="Search saved jobs"
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

      <div className="mt-4">
        {isLoading ? (
          <LoadingState rows={3} />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="No saved jobs yet"
            message="Tap the bookmark on any job to keep it here for later."
            action={
              <Link href="/jobs">
                <Button>Browse jobs</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid-cards">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                href={`/jobs/${job.id}`}
                saved
                onToggleSave={() => handleRemoveJob(job)}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination className="mt-8" page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
    </div>
  );
}
