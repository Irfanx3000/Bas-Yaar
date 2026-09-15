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
          rather than the current page — so "Active 12" stays 12 on page 2.

          Each count pill is coloured by MEANING, not by one house colour:
          Active is green, Closed is red, Selected and All are brand blue. Those
          values live on APPLICATION_TABS as `badgeColor`, whose own comment says
          it "drives the count pill color on each inactive tab".

          The one rule that is not in the data: an INACTIVE "All" pill is grey
          (#8896A5), because "All" is a scope rather than a status and colouring
          it blue would imply a state it does not have. A selected tab always
          reverts to brand blue, handled inside Tabs. */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={tabs.map((tab) => ({
          value: tab.id,
          label: t(tab.labelKey),
          count: counts?.[tab.id],
          badgeColor: tab.id === "all" ? "#8896A5" : tab.badgeColor,
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
        <aside className="mt-6 lg:mt-0">
          <Card radius="lg" padding="none" className="overflow-hidden border border-line-soft shadow-sm">
            <div className="flex items-center gap-2 border-b border-line-soft bg-primary-light/60 px-5 py-3">
              <Icon name="cog" size={14} className="text-primary" />
              <h2 className="text-xs font-extrabold tracking-wider uppercase text-primary">
                Support & Advisory Services
              </h2>
            </div>

            <div className="space-y-5 p-5">
              {/* Need Help Section */}
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Icon name="help-circle" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-md font-bold text-heading">Need Assistance?</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-body">
                    Get in touch with our marine career advisors for help with your applications.
                  </p>
                  <Link
                    href="/settings"
                    className="press mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-light/50 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Contact Support
                    <Icon name="arrow-right" size={10} />
                  </Link>
                </div>
              </div>

              {/* Promo Banner Integration */}
              <PromoBanner />

              {/* Personal Consultancy Section */}
              <div className="border-t border-line-soft pt-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-tint text-warning-text">
                    <Icon name="user-circle" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-bold text-heading">1-on-1 Consultancy</h3>
                      <span className="rounded-full bg-secondary-tint px-2 py-0.5 text-[10px] font-extrabold uppercase text-warning-text">
                        Expert
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-body">
                      Get expert guidance for your marine career in a live meeting.
                    </p>
                    <Link
                      href="/consultancy"
                      className="bg-gradient-primary press mt-2.5 block w-full rounded-lg py-2 text-center text-xs font-extrabold text-on-primary shadow-xs"
                    >
                      Book Live Meeting
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </aside>

      </div>
    </div>
  );
}
