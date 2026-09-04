"use client";

/* Job alerts — jobs matching the user's saved preferences.
 *
 * Hook contract: jobs · totalCount · currentPage · totalPages · searchKeyword
 * bookmarkedJobs · isLoading · error · handleSearch · handlePageChange
 * handleRefresh · toggleBookmark
 *
 * Gated behind a subscription in the app, so `useSubscriptionStatus` decides
 * whether to show the list or the upsell.
 */

import { useState } from "react";
import Link from "next/link";
import { useJobAlerts } from "@/hooks/useJobAlerts";
import { useSubscriptionStatus } from "@/context/SubscriptionContext";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  JobCard,
  LoadingState,
  Pagination,
  SectionTitle,
} from "@/components/ui";

export default function JobAlertsPage() {
  const {
    jobs,
    totalCount,
    currentPage,
    totalPages,
    bookmarkedJobs,
    isLoading,
    error,
    handleSearch,
    handlePageChange,
    handleRefresh,
    toggleBookmark,
  } = useJobAlerts();

  /* Contract: { subscription, isActive, tier, applicationsUsed, applicationLimit,
     applicationsRemaining, loading }. It is `isActive`, not
     `hasActiveSubscription` — and `loading` stays true until the first fetch
     STARTS, so gating on it is what stops one frame of "you have no plan"
     flashing at a subscriber. */
  const { isActive, loading: subscriptionLoading } = useSubscriptionStatus() ?? {};
  const [query, setQuery] = useState("");

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      <SectionTitle
        className="pt-2"
        action={!isLoading && !error ? <span className="text-sm text-body">{totalCount} matches</span> : null}
      >
        Job alerts
      </SectionTitle>
      <p className="mt-[5px] max-w-prose text-md text-body">
        Jobs matching the preferences on your profile. Update them any time from{" "}
        <Link href="/preferences" className="font-semibold text-primary hover:underline">
          Preferences
        </Link>
        .
      </p>

      {!subscriptionLoading && !isActive ? (
        <Card className="mt-4 border-secondary-tint bg-secondary-light text-center">
          <Icon name="lock" size={26} className="mx-auto text-secondary" />
          <p className="mt-2 text-lg font-bold text-heading">Alerts need an active plan</p>
          <p className="mt-1 text-sm text-body">Subscribe to get notified the moment a matching job is posted.</p>
          <Link
            href="/subscription"
            className="bg-gradient-secondary press mt-3 inline-block rounded-md px-6 py-3 text-md font-bold text-on-secondary shadow-sm"
          >
            Subscribe
          </Link>
        </Card>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="mt-4 flex gap-2"
      >
        <label className="flex min-h-[50px] flex-1 items-center gap-2 rounded-[12px] border border-line-input bg-surface px-4">
          <Icon name="search" size={14} className="shrink-0 text-hint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter your alerts"
            aria-label="Filter alerts"
            className="w-full bg-transparent text-md text-heading outline-none focus-visible:outline-none placeholder:text-hint"
          />
        </label>
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRefresh} />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No matching jobs yet"
            message="We'll show jobs here as soon as one matches your preferences."
            action={
              <Link href="/preferences">
                <Button variant="outline">Update preferences</Button>
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
                saved={!!bookmarkedJobs?.[job.id]}
                onToggleSave={toggleBookmark}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination className="mt-8" page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
    </div>
  );
}
