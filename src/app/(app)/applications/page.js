"use client";

/* My Applications — Block D, mirroring the app's MyApplicationsScreen.
 *
 * Composition is the app's, in its order: heading with a "Your CV" action,
 * status tabs with counts, the list, pagination, Need Help, the admin promo
 * banner, then Personal Consultancy.
 *
 * Contracts read before writing, per the standing rule:
 *   useApplicationsData → { tabs, activeTab, setActiveTab, counts, applications,
 *                           currentPage, setCurrentPage, totalPages, isLoading,
 *                           isRefreshing, handleRefresh, handleWithdraw }
 *     note setCurrentPage / setActiveTab, NOT handlePageChange — useJobsData
 *     uses the other name for the same idea.
 *   application        → { id, jobId, title, location, logo, status, dateText,
 *                          appliedAt }
 *   APPLICATION_TABS   → all · active · selected · closed, each with `statuses`
 *                        and a badgeColor
 *
 * WITHDRAW IS NOT OFFERED ON EVERY CARD. The app derives the withdrawable set
 * from the Active tab's own statuses — applied, under_review, interview — so a
 * selected or rejected application shows no withdraw action. Deriving it from
 * that tab rather than repeating a list is the app's own "single source of
 * truth" comment, and it is copied here for the same reason.
 */

import Link from "next/link";
import { useApplicationsData } from "@/hooks/useApplicationsData";
import { APPLICATION_TABS } from "@/constants/applications.constants";
import { t } from "@/i18n";
import {
  ApplicationCard,
  Button,
  Card,
  EmptyState,
  Icon,
  LoadingState,
  Pagination,
  PromoBanner,
  Tabs,
} from "@/components/ui";

/* Single source of truth, exactly as the app does it: whatever the Active tab
   counts as active is what can be withdrawn. */
const WITHDRAWABLE = APPLICATION_TABS.find((tab) => tab.id === "active")?.statuses ?? [];

export default function ApplicationsPage() {
  const {
    tabs,
    activeTab,
    setActiveTab,
    counts,
    applications,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    handleWithdraw,
  } = useApplicationsData();

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3 pt-2 pb-4">
        <div className="min-w-0">
          <h1 className="text-h2 font-extrabold text-heading">My Applications</h1>
          <p className="mt-[2px] text-md text-body">
            Track the status of all the jobs you&apos;ve applied for.
          </p>
        </div>
        <Link href="/cv" className="shrink-0">
          <Button variant="outline" size="sm" icon="file-alt">
            Your CV
          </Button>
        </Link>
      </header>

      {/* Counts come from the hook, which computes them across ALL applications
          rather than the current page — so "Active 12" stays 12 on page 2. */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={tabs.map((tab) => ({
          value: tab.id,
          label: t(tab.labelKey),
          count: counts?.[tab.id],
        }))}
      />

      <div className="mt-4 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-6">
        <div className="min-w-0">
          {isLoading ? (
            <LoadingState rows={3} />
          ) : applications.length === 0 ? (
            <EmptyState
              icon="file-alt"
              title="Nothing here yet"
              message={
                activeTab === "all"
                  ? "You haven't applied to any jobs yet."
                  : "No applications with this status."
              }
              action={
                <Link href="/jobs">
                  <Button>Browse jobs</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid-cards">
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  /* Only the statuses the Active tab covers. Passing undefined
                     is what hides the button — the card renders no action when
                     there is nothing valid to do. */
                  onWithdraw={
                    WITHDRAWABLE.includes(application.status) ? handleWithdraw : undefined
                  }
                />
              ))}
            </div>
          )}

          <Pagination
            className="mt-8"
            page={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </div>

        {/* The app stacks these three below the list. On desktop they become a
            rail, so the list is not pushed off the fold by support and promo
            content the user did not come for. */}
        <aside className="mt-6 space-y-3 lg:mt-0">
          <Card radius="lg" className="text-center">
            <Icon name="help-circle" size={26} className="mx-auto text-primary" />
            <p className="mt-2 text-lg font-bold text-heading">Need Help?</p>
            <p className="mt-1 text-sm text-body">
              Get in touch and we&apos;ll help you with your applications.
            </p>
            <Link
              href="/settings"
              className="press mt-3 block rounded-md border-[1.5px] border-primary py-2 text-center text-md font-semibold text-primary"
            >
              Contact Support
            </Link>
          </Card>

          {/* Admin-managed. Renders nothing when there are no banners or the
              fetch fails — see the note in the component. */}
          <PromoBanner />

          <Card radius="lg" className="border-line-mint text-center">
            <Icon name="user-circle" size={24} className="mx-auto text-primary" />
            <p className="mt-2 text-lg font-bold text-heading">Personal Consultancy</p>
            <p className="mt-1 text-sm text-body">
              Get expert guidance for your marine career in a live 1-on-1 meeting.
            </p>
            <Link
              href="/consultancy"
              className="bg-gradient-primary press mt-3 block rounded-md py-3 text-center text-md font-bold text-on-primary shadow-sm"
            >
              Book a Live Meeting
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
