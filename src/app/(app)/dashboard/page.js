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
import { jobHref } from "@/lib/jobUrl";
import { useHomeData } from "@/hooks/useHomeData";
import { ApplicationCard, Button, ErrorState, JobCard, LoadingState } from "@/components/ui";
import { CategoryTiles, CVMeta, HomeHero, PromoCard, SectionRow } from "@/components/home/HomeSections";

export default function DashboardPage() {
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
        tagline="Explore global cruise careers"
        action={
          <Link href="/jobs">
            <Button icon="search">Browse jobs</Button>
          </Link>
        }
      />

      <SectionRow title="Categories" href="/jobs">
        <CategoryTiles />
      </SectionRow>

      <SectionRow title="Featured Jobs" href="/jobs">
        {isLoading ? (
          <LoadingState rows={2} />
        ) : loadFailed ? (
          <ErrorState message="We couldn't load featured jobs." onRetry={handleRefresh} />
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
          <p className="text-md text-body">No featured jobs right now. Check back soon.</p>
        )}
      </SectionRow>

      <SectionRow title="Recently Applied" href="/applications">
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
            You haven&apos;t applied to anything yet.{" "}
            <Link href="/jobs" className="font-semibold text-primary hover:underline">
              Browse jobs
            </Link>
            .
          </p>
        )}
      </SectionRow>

      {/* Same tile shape and same grid as the job and application cards above —
          one page, one visual language. */}
      <SectionRow title="Next steps">
        <div className="grid-cards">
          <PromoCard
            icon="file-alt"
            title="Your CV"
            message="A strong CV increases your chances of getting hired."
            href="/cv"
            cta={cvStatus?.lastUpdated ? "Update CV" : "Create your CV"}
            meta={<CVMeta cvStatus={cvStatus} />}
          />
          <PromoCard
            variant="outline"
            icon="check-circle"
            title="Track your applications"
            message="We'll notify you the moment there's an update."
            href="/applications"
            cta="View applications"
          />
          <PromoCard
            icon="user-circle"
            title="Personal consultancy"
            message="Get expert guidance for your marine career in a live 1-on-1 meeting."
            href="/consultancy"
            cta="Book a live meeting"
          />
        </div>
      </SectionRow>
    </div>
  );
}
