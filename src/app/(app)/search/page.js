"use client";

/* Universal search. Unlike /jobs this hits the search endpoint, which returns
 * GROUPS of lightweight rows rather than full job objects:
 *
 *   groups: [{ entityType, count, results: [{ id, title, subtitle, navigable }] }]
 *
 * So results render as rows, not JobCards — a JobCard needs salary, location and
 * tier, none of which the search payload carries. Clicking through to
 * /jobs/[id] loads the full record. Resisting the urge to call resolveJob() per
 * row on mount: that would be one request per result to draw a card the user may
 * never click.
 *
 * When jobs come back empty the hook loads `suggestedJobs` instead — those ARE
 * full job objects, so they render as cards.
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { jobHref } from "@/lib/jobUrl";
import { useSearchResults } from "@/hooks/useSearchResults";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  JobCard,
  LoadingState,
  SectionTitle,
} from "@/components/ui";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
          <LoadingState rows={3} className="pt-6" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const { query, jobsGroup, isLoading, error, runSearch, suggestedJobs, isLoadingSuggestions } =
    useSearchResults(initial);
  const [term, setTerm] = useState(initial);

  const results = jobsGroup?.results ?? [];

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      <SectionTitle className="pt-2">Search</SectionTitle>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(term);
        }}
        className="mt-3 flex gap-2"
      >
        <label className="flex min-h-[50px] flex-1 items-center gap-2 rounded-[12px] border border-line-input bg-surface px-4">
          <Icon name="search" size={14} className="shrink-0 text-hint" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search jobs, ranks, vessels…"
            aria-label="Search"
            className="w-full bg-transparent text-md text-heading outline-none focus-visible:outline-none placeholder:text-hint"
          />
        </label>
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => runSearch(term)} />
        ) : results.length > 0 ? (
          <>
            <p className="mb-3 text-sm text-body">
              {jobsGroup.count ?? results.length} results for “{query}”
            </p>
            <div className="space-y-2">
              {results.map((row) => (
                <Link key={row.id} href={jobHref({ id: row.id, title: row.title })} className="block">
                  <Card className="flex items-center gap-3 hover:border-primary">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
                      <Icon name="briefcase" size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-md font-bold text-heading">{row.title}</p>
                      {row.subtitle ? (
                        <p className="truncate text-sm text-body">{row.subtitle}</p>
                      ) : null}
                    </div>
                    <Icon name="chevron-right" size={12} className="shrink-0 text-hint" />
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : query ? (
          <>
            <EmptyState
              icon="search"
              title={`Nothing matched “${query}”`}
              message="Try a rank, a vessel type, or a shorter term."
            />
            {isLoadingSuggestions ? (
              <LoadingState rows={2} />
            ) : suggestedJobs?.length ? (
              <>
                <h2 className="mt-6 text-xl font-bold text-heading">You might like these</h2>
                <div className="grid-cards mt-3">
                  {suggestedJobs.map((job) => (
                    <JobCard key={job.id} job={job} href={jobHref(job)} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="search"
            title="Search for a job"
            message="Try a rank like “Second Engineer”, or a vessel type."
          />
        )}
      </div>
    </div>
  );
}
