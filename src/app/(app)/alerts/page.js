"use client";

/* Job alerts — jobs matching the user's SUBSCRIPTION PLAN.
 *
 * Not their preferences. This page said "jobs matching the preferences on your
 * profile" and linked to /preferences, which is simply not what the endpoint
 * does. `listJobAlertsForUser` on the backend takes the user's tier, expands it
 * to every tier at or below it, and returns published jobs whose `minimumTier`
 * is in that set. Preferences are never read. The app's own copy says "Jobs
 * matching your subscription plan", and that copy is used verbatim here.
 *
 * WHY THE FEED IS EMPTY WITHOUT A PLAN, and why that is not an error:
 * `listJobAlertsForUser` returns `{ jobs: [], total: 0 }` outright for anyone
 * whose `subscriptionStatus` is not 'active'. So "no matching jobs yet" is the
 * wrong thing to say — there is no plan to match against. The app branches
 * noSubscription → empty → list as a single chain; this page used to render the
 * upsell card AND then fall through to the empty state, showing two competing
 * explanations at once with an "Update preferences" button that fixes neither.
 *
 * THE NOTIFICATION IS BROADER THAN THIS FEED. `notifyEligibleUsersForJob` fans
 * out on `$or` of two match reasons — an active qualifying tier, OR the job's
 * category being in the user's `preferredCategories` regardless of plan. So an
 * unsubscribed user with a matching category can be notified about a job that
 * this feed will not show them. That asymmetry is the backend's, it is
 * deliberate there ("jobs regarding my plan", per jobAlerts.service), and it is
 * not something the web can or should paper over — which is exactly why the
 * no-plan card explains the rule instead of pretending the list is empty.
 *
 * Hook contract: jobs · totalCount · currentPage · totalPages · searchKeyword
 * bookmarkedJobs · isLoading · error · handleSearch · handlePageChange
 * handleRefresh · toggleBookmark
 */

import { useState } from "react";
import Link from "next/link";
import { jobHref } from "@/lib/jobUrl";
import { useJobAlerts } from "@/hooks/useJobAlerts";
import { useSubscriptionStatus } from "@/context/SubscriptionContext";
import { t } from "@/i18n";
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
        action={
          !isLoading && !error && isActive ? (
            <span className="text-sm text-body">{t("jobAlerts.counter", { count: totalCount })}</span>
          ) : null
        }
      >
        {t("jobAlerts.screenTitle")}
      </SectionTitle>
      <p className="mt-[5px] max-w-prose text-md text-body">{t("jobAlerts.screenSubtitle")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className={`mt-4 flex gap-2 ${!subscriptionLoading && !isActive ? "hidden" : ""}`}
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

      {/* The app's exact branching order. The no-plan card comes FIRST, because
          without a plan the feed is empty by definition and "no matching jobs"
          would be a false explanation of a state the user can actually fix. */}
      <div className="mt-4">
        {isLoading || subscriptionLoading ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRefresh} />
        ) : !isActive ? (
          <Card className="mx-auto max-w-lg text-center" radius="lg">
            <span className="mx-auto flex size-16 items-center justify-center rounded-round bg-primary-light text-primary">
              <Icon name="bell" size={26} />
            </span>
            <p className="mt-3 text-h3 font-bold text-heading">{t("jobAlerts.noSubscriptionTitle")}</p>
            <p className="mt-2 text-md font-medium text-body">{t("jobAlerts.noSubscriptionSubtitle")}</p>
            <Link href="/subscription" className="mt-4 inline-block">
              <Button>{t("jobAlerts.subscribeCta")}</Button>
            </Link>
          </Card>
        ) : jobs.length === 0 ? (
          <EmptyState icon="bell" title={t("jobAlerts.emptyTitle")} message={t("jobAlerts.emptySubtitle")} />
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
      </div>

      {isActive ? (
        <Pagination className="mt-8" page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
      ) : null}
    </div>
  );
}
