"use client";

/* Home — Block B of Phase 4, and the screen a client is shown first.
 *
 * Composed from the app's own screenshot: image hero, categories, featured
 * jobs, recently applied, then three promo tiles. Data comes from `useHomeData`,
 * copied verbatim in Phase 2.
 *
 * Two things deliberately do NOT live on this page:
 *   · search — it belongs to the app, so it sits in the top bar, reachable from
 *     every route rather than duplicated per screen
 *   · the subscription CTA — a property of the account, not of Home. Also in the
 *     bar, which stops a full-width banner pushing real content down.
 *
 * That leaves one column: hero, sections, then a row of promo tiles. The earlier
 * right rail is gone — with those two moved out, too little was left in it to
 * justify splitting the page.
 */

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { jobHref } from "@/lib/jobUrl";
import { useHomeData } from "@/hooks/useHomeData";
import { ApplicationCard, Button, ErrorState, JobCard, LoadingState } from "@/components/ui";
import { CategoryTiles, CVMeta, HomeHero, PromoCard, SectionRow } from "@/components/home/HomeSections";

export default function DashboardPage() {
  const { t } = useTranslation();
  const {
    userName,
    featuredJobs,
    recentApplications,
    cvStatus,
    isLoading,
    loadFailed,
    bookmarkedJobs,
    toggleBookmark,
    handleRefresh,
  } = useHomeData();

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      <HomeHero
        userName={userName}
        tagline={t("home.header.exploreCareer")}
        action={
          <Link href="/jobs">
            <Button icon="search">{t("web.jobs.dashboard.browseJobs")}</Button>
          </Link>
        }
      />

      <SectionRow title={t("home.categories.title")} href="/jobs">
        <CategoryTiles />
      </SectionRow>

      <SectionRow title={t("jobs.featured.title")} href="/jobs">
        {isLoading ? (
          <LoadingState rows={2} />
        ) : loadFailed ? (
          <ErrorState message={t("web.jobs.dashboard.featuredError")} onRetry={handleRefresh} />
        ) : featuredJobs?.length ? (
          <div className="grid-cards">
            {featuredJobs.slice(0, 6).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                href={jobHref(job)}
                saved={!!bookmarkedJobs?.[job.id]}
                onToggleSave={toggleBookmark}
              />
            ))}
          </div>
        ) : (
          <p className="text-md text-body">{t("jobs.featured.empty")}</p>
        )}
      </SectionRow>

      <SectionRow title={t("applications.recentlyApplied")} href="/applications">
        {isLoading ? (
          <LoadingState rows={2} />
        ) : recentApplications?.length ? (
          <div className="grid-cards">
            {recentApplications.slice(0, 3).map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <p className="text-md text-body">
            {t("web.jobs.dashboard.noApplications")}{" "}
            <Link href="/jobs" className="font-semibold text-primary hover:underline">
              {t("web.jobs.dashboard.browseJobs")}
            </Link>
            .
          </p>
        )}
      </SectionRow>

      {/* Same tile shape and same grid as the job and application cards above —
          one page, one visual language. */}
      <SectionRow title={t("web.jobs.dashboard.nextSteps")}>
        <div className="grid-cards">
          <PromoCard
            icon="file-alt"
            title={t("home.cvStatus.title")}
            message={t("web.jobs.dashboard.cvMessage")}
            href="/cv"
            cta={cvStatus?.lastUpdated ? t("home.cvStatus.update") : t("web.jobs.dashboard.createCv")}
            meta={<CVMeta cvStatus={cvStatus} />}
          />
          <PromoCard
            variant="outline"
            icon="check-circle"
            title={t("web.jobs.dashboard.trackTitle")}
            message={t("web.jobs.dashboard.trackMessage")}
            href="/applications"
            cta={t("web.jobs.dashboard.viewApplications")}
          />
          <PromoCard
            icon="user-circle"
            title={t("home.consultancy.title")}
            message={t("home.consultancy.subtitle")}
            href="/consultancy"
            cta={t("home.consultancy.book")}
          />
        </div>
      </SectionRow>
    </div>
  );
}
