"use client";

/* Job details — a MIRROR of the app's JobDetailsScreen (1,493 LOC).
 *
 * Behaviour, states, precedence and copy are the app's. Only the shell is ours:
 * mobile keeps the app's exact order with a pinned action bar; desktop moves
 * the eligibility, unlock, refer and action blocks into a sticky right rail.
 *
 * ── Logic mirrored verbatim, and the traps inside it ────────────────────────
 *
 * 1. THE BANNER IS ABOUT DOCUMENTS ONLY.
 *      const isEligible = hasRequiredDocuments;   // green/red banner
 *      const canApply   = eligible;               // the Apply button
 *    So "You're eligible to apply" sitting above a Subscribe card is deliberate,
 *    not a contradiction: documents own the banner and the red tiles, the
 *    subscription side owns the unlock card. Merging them would make the banner
 *    say something the app never says.
 *
 * 2. BLOCKER PRECEDENCE IS LOAD-BEARING.
 *      tier (when the job needs > start) → noSubscription → tier → limit
 *    Tier is checked BEFORE "no subscription at all" whenever the job requires
 *    more than the base tier. Otherwise a new user on a Premium-only job reads
 *    "Subscribe to any plan", buys the cheapest Start plan, and is still
 *    blocked — a refund and a support ticket that only the ordering prevents.
 *    That reasoning is the app's own comment, not mine.
 *
 * 3. `eligible` IS NEVER RECOMPUTED HERE. It is server-computed and re-checked
 *    at apply time. Hiding the Apply button is UX, not enforcement.
 *
 * 4. APPLIED IS A MODE, NOT A STATE. The app does not even fetch eligibility
 *    once you have applied (`useApplicationEligibility(!isAppliedMode ? id : null)`).
 *    Documents relabel to "Submitted", missing flags are suppressed, refer hides
 *    on rejection, and the action bar collapses to one button.
 *
 * ── The one thing the web had to solve differently ──────────────────────────
 * The app receives `application` through route params from MyApplicationsScreen.
 * A URL has no route params, and there is no GET /applications?jobId= endpoint.
 * So: AppliedJobsContext already knows the applied job ids — only when it says
 * this job is applied do we fetch the list and find the match. The common case
 * costs nothing, and no endpoint was invented.
 */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jobService } from "@/services/job.service";
import { applicationService } from "@/services/application.service";
import { useApplicationEligibility } from "@/hooks/useApplicationEligibility";
import { useSavedJobsContext } from "@/context/SavedJobsContext";
import { useAppliedJobs } from "@/context/AppliedJobsContext";
import { APPLICATION_STATUS } from "@/constants/applications.constants";
import { NEXT_TIER } from "@/constants/subscription.constants";
import { TIER_LABEL } from "@/utils/subscriptionDisplay";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { t } from "@/i18n";
import { jobIdFromSlug } from "@/lib/jobUrl";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Icon,
  InlineAlert,
  LoadingState,
  StatusBadge,
  Tabs,
} from "@/components/ui";

/* Copy map, verbatim from the app. */
const UNLOCK_CARD_COPY = {
  noSubscription: { title: "jobs.details.unlockTitle", subtitle: "jobs.details.unlockSubtitle" },
  tier: { title: "jobs.details.unlockTitleTier", subtitle: "jobs.details.unlockSubtitleTier" },
  limit: { title: "jobs.details.unlockTitleLimit", subtitle: "jobs.details.unlockSubtitleLimit" },
};

/* The app's four applied-status configurations. Anything else falls back to
   'submitted', exactly as APPLIED_STATUS_UI[...] ?? does there. */
const APPLIED_STATUS_UI = {
  [APPLICATION_STATUS.APPLIED]: { tags: ["Applied"], banner: "submitted" },
  [APPLICATION_STATUS.UNDER_REVIEW]: { tags: ["Applied", "Under Review"], banner: "underReview" },
  [APPLICATION_STATUS.INTERVIEW]: { tags: ["Interview"], banner: "interview" },
  [APPLICATION_STATUS.SELECTED]: { tags: ["Selected"], banner: "selected" },
};

const APPLIED_BANNER = {
  submitted: { tone: "success", icon: "check-circle" },
  underReview: { tone: "info", icon: "hourglass-half" },
  interview: { tone: "info", icon: "calendar-check" },
  selected: { tone: "success", icon: "check-circle" },
  rejected: { tone: "error", icon: "times-circle" },
};

function DocumentTile({ name, missing }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-md border p-3 text-center ${
        missing ? "border-danger/30 bg-danger-light" : "border-success/30 bg-success-light"
      }`}
    >
      <Icon
        name={missing ? "help-circle" : "file-alt"}
        size={20}
        className={missing ? "text-danger" : "text-success"}
      />
      <span className="text-xs font-semibold text-heading capitalize">
        {String(name).replace(/[-_]/g, " ")}
      </span>
    </div>
  );
}

export default function JobDetailsPage({ params }) {
  const { slug } = use(params);
  const jobId = jobIdFromSlug(slug);
  const router = useRouter();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [application, setApplication] = useState(null);

  /* Contracts quoted at the call site — both verified, both previously wrong:
       SavedJobsContext   toggleSaved takes the JOB OBJECT, not an id
       AppliedJobsContext has no markApplied; refresh() after applying */
  const { isSaved, toggleSaved } = useSavedJobsContext();
  const { isApplied, refresh: refreshApplied } = useAppliedJobs();

  const isAppliedMode = application !== null;
  const applicationStatus = application?.status;
  const isRejected = isAppliedMode && applicationStatus === APPLICATION_STATUS.REJECTED;

  /* Mirrors the app: eligibility is not fetched at all in applied mode. */
  const eligibility = useApplicationEligibility(!isAppliedMode && jobId ? jobId : null);
  const {
    eligible,
    hasActiveSubscription,
    hasRequiredDocuments,
    requiredDocuments,
    missingDocuments,
    meetsTierRequirement,
    jobMinimumTier,
    userTier,
    applicationsUsed,
    applicationLimit,
    applicationsRemaining,
  } = eligibility;

  const isEligible = hasRequiredDocuments; // banner — documents only
  const canApply = eligible; // button — server truth

  const blockReason =
    jobMinimumTier !== "start" && !meetsTierRequirement
      ? "tier"
      : !hasActiveSubscription
        ? "noSubscription"
        : !meetsTierRequirement
          ? "tier"
          : applicationsRemaining === 0
            ? "limit"
            : null;

  const requiredTierLabel = TIER_LABEL[jobMinimumTier] || TIER_LABEL.start;
  const nextTierLabel = TIER_LABEL[NEXT_TIER[userTier]] || TIER_LABEL.premium;

  const load = useCallback(async () => {
    if (!jobId) {
      setError("That job link doesn't look right.");
      setLoading(false);
      return;
    }
    try {
      // Every state write is after the first await — see the note in AuthGuard.
      const [next, appliedAlready] = [await jobService.getJobById(jobId), isApplied?.(jobId)];
      setJob(next);
      setError(null);

      /* Only when the context already says this job is applied. No endpoint
         invented; one extra request, and only for jobs the user has applied to. */
      if (appliedAlready) {
        const list = await applicationService.getApplications({ limit: 100 });
        setApplication(list?.find((a) => a.jobId === jobId) ?? null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [jobId, isApplied]);

  /* Fetch on mount. `load` is async and writes no state before its first await,
     so this does not actually cascade — the rule cannot prove that across a call
     boundary and flags every client-side fetch. When /jobs moves to the public
     surface in Phase 5 this route becomes a server component and the effect goes
     away rather than being silenced. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const retry = () => {
    setLoading(true);
    load();
  };

  const onApply = async () => {
    if (!canApply) return;
    setApplying(true);
    setApplyError(null);
    try {
      await applicationService.apply(jobId);
      await refreshApplied?.();
      eligibility.refresh?.();
      await load();
    } catch (err) {
      setApplyError(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-[15px] py-6 lg:px-6">
        <LoadingState rows={3} />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-6xl px-[15px] py-6 lg:px-6">
        <ErrorState message={error || "That job could not be found."} onRetry={retry} />
      </div>
    );
  }

  const statusUi = APPLIED_STATUS_UI[applicationStatus] ?? APPLIED_STATUS_UI[APPLICATION_STATUS.APPLIED];
  const bannerKind = isRejected ? "rejected" : statusUi.banner;
  const banner = APPLIED_BANNER[bannerKind];

  /* Live usage pill. Hidden for unlimited plans (applicationLimit null) and when
     there is no subscription — exactly the app's two conditions. */
  const showUsagePill = !isAppliedMode && hasActiveSubscription && applicationLimit != null;
  const usageSeverity =
    applicationsRemaining === 0
      ? "critical"
      : applicationsRemaining / applicationLimit <= 0.3
        ? "warning"
        : "normal";

  const actions = (
    <>
      {applyError ? <InlineAlert tone="error">{applyError}</InlineAlert> : null}

      {isAppliedMode ? (
        <Button fullWidth icon="paper-plane" onClick={() => router.push("/jobs")}>
          {isRejected ? t("jobs.details.viewOtherJobs") : t("jobs.details.viewSimilarJobs")}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon="bookmark"
            className="flex-1"
            onClick={() => toggleSaved(job)}
          >
            {isSaved?.(job.id) ? t("jobs.details.savedJob") : t("jobs.details.saveJob")}
          </Button>

          {canApply ? (
            <Button className="flex-1" icon="paper-plane" loading={applying} onClick={onApply}>
              {applying ? t("jobs.details.applying") : t("jobs.details.applyNow")}
            </Button>
          ) : eligibility.alreadyApplied ? (
            <Button className="flex-1" icon="check-circle" onClick={() => router.push("/applications")}>
              {t("jobs.details.alreadyApplied")}
            </Button>
          ) : (
            <Button className="flex-1" icon="paper-plane" disabled>
              {t("jobs.details.cantApply")}
            </Button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      {/* ONE card: image band and details in the same container.
          Previously the details card was pulled up over the hero with `-mt-8`,
          which read as two competing boxes and clipped the status badge in the
          seam between them — the badge sat at the bottom of the hero, exactly
          where the overlapping card landed. Stacking them inside a single
          `overflow-hidden` card removes the overlap rather than tuning it, and
          the badge has room of its own. Same shape as JobCard, which is what
          the user just came from. */}
      <Card radius="lg" padding="none" elevation="md" className="overflow-hidden">
        {/* Jobs carry no photo field, so this is the app's header gradient. */}
        <div className="bg-gradient-header relative flex h-36 items-end p-4 sm:h-44">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="glass absolute top-4 left-4 flex size-10 items-center justify-center rounded-round text-heading shadow-float"
          >
            <Icon name="chevron-left" size={14} />
          </button>

          <div className="flex flex-wrap gap-[5px]">
            {isAppliedMode ? (
              isRejected ? (
                <StatusBadge status="rejected" />
              ) : (
                statusUi.tags.map((tag) => <StatusBadge key={tag} status={tag} label={tag} />)
              )
            ) : job.isFeatured ? (
              <StatusBadge status="featured" />
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-line-soft p-4">
          <div className="min-w-0">
            <h1 className="text-h3 font-extrabold text-heading">{job.title}</h1>
            {job.salary ? (
              <p className="mt-1 text-lg font-bold text-primary">
                {job.salary} <span className="text-sm font-medium text-hint">{job.salaryUnit}</span>
              </p>
            ) : null}
          </div>
          {job.location ? (
            <p className="flex shrink-0 items-center gap-1 text-md text-body">
              <Icon name="map-marker-alt" size={13} />
              {job.location}
            </p>
          ) : null}
        </div>
      </Card>

      <div className="mt-4 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-6">
        <div className="min-w-0">
          {/* Banner: application status in applied mode, DOCUMENT eligibility
              otherwise — never overall eligibility. */}
          {isAppliedMode ? (
            /* Rejection has its own copy keys (notSelectedTitle/Subtitle), not a
               `rejectedBanner*` pair — the other four follow the bannerKind
               pattern. And submittedBannerSubtitle interpolates {{date}}, so the
               applied date is passed as a variable rather than concatenated. */
            <InlineAlert
              tone={banner.tone}
              title={t(isRejected ? "jobs.details.notSelectedTitle" : `jobs.details.${bannerKind}BannerTitle`)}
            >
              {t(
                isRejected
                  ? "jobs.details.notSelectedSubtitle"
                  : `jobs.details.${bannerKind}BannerSubtitle`,
                { date: application?.dateText ?? "" },
              )}
            </InlineAlert>
          ) : !eligibility.loading ? (
            <InlineAlert
              tone={isEligible ? "success" : "error"}
              title={t(isEligible ? "jobs.details.eligibleTitle" : "jobs.details.ineligibleTitle")}
            >
              {t(isEligible ? "jobs.details.eligibleSubtitle" : "jobs.details.ineligibleSubtitle")}
            </InlineAlert>
          ) : null}

          <Tabs
            className="mt-4"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "overview", label: "Overview" },
              {
                value: "requirements",
                label: "Requirements",
                /* The app puts a red count badge on the Requirements tab when
                   documents are missing — that is how you find out which tab to
                   open. Suppressed in applied mode with the other missing flags. */
                count: !isAppliedMode && missingDocuments?.length ? missingDocuments.length : undefined,
              },
            ]}
          />

          {tab === "overview" ? (
            <Card className="mt-4">
              <h2 className="text-lg font-bold text-heading">About the Job</h2>
              <p className="mt-2 max-w-prose whitespace-pre-line text-md text-body">
                {job.description || "No description was provided for this position."}
              </p>
              {job.responsibilities?.length ? (
                <>
                  <h3 className="mt-4 text-md font-bold text-heading">Responsibilities</h3>
                  <ul className="mt-2 max-w-prose list-disc space-y-1 pl-5 text-md text-body">
                    {job.responsibilities.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </>
              ) : null}
              {job.benefits?.length ? (
                <>
                  <h3 className="mt-4 text-md font-bold text-heading">Benefits</h3>
                  <ul className="mt-2 max-w-prose list-disc space-y-1 pl-5 text-md text-body">
                    {job.benefits.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </>
              ) : null}
            </Card>
          ) : (
            <Card className="mt-4">
              <h2 className="text-lg font-bold text-heading">Requirements</h2>
              {job.requirements?.length ? (
                <ul className="mt-2 max-w-prose list-disc space-y-1 pl-5 text-md text-body">
                  {job.requirements.map((r) => <li key={r}>{r}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-md text-body">No specific requirements were listed.</p>
              )}
              {job.requiredSkills?.length ? (
                <div className="mt-4 flex flex-wrap gap-[5px]">
                  {job.requiredSkills.map((s) => <Chip key={s}>{s}</Chip>)}
                </div>
              ) : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-md sm:grid-cols-3">
                {[
                  ["Department", job.department],
                  ["Rank", job.rank],
                  ["Vessel", job.vesselType],
                  ["Vacancies", job.vacancies],
                  ["Joining", job.joiningDate ? new Date(job.joiningDate).toLocaleDateString() : null],
                  ["Deadline", job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : null],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-sm text-hint">{label}</dt>
                      <dd className="font-semibold text-heading">{value}</dd>
                    </div>
                  ))}
              </dl>
            </Card>
          )}

          {/* Documents. Label and missing-flags both switch on applied mode,
              and the grid is a fixed 4 columns — the app pinned it because a
              job needing one document stretched that tile to fill the row. */}
          {requiredDocuments?.length ? (
            <Card className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-heading">
                  {t(isAppliedMode ? "jobs.details.documentsSubmitted" : "jobs.details.documentsRequired")}
                </h2>
                <Link href="/documents" className="text-sm font-semibold text-primary hover:underline">
                  View All
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {requiredDocuments.map((doc) => (
                  <DocumentTile
                    key={doc}
                    name={doc}
                    missing={missingDocuments?.includes(doc) && !isAppliedMode}
                  />
                ))}
              </div>

              {/* Hidden entirely when rejected — the app wraps this in
                  `{!isRejected && …}`, because telling someone their documents
                  are incomplete after a rejection is noise they cannot act on. */}
              {!isRejected ? (
                <p
                  className={`mt-3 text-sm font-semibold ${
                    isEligible || isAppliedMode ? "text-primary" : "text-danger"
                  }`}
                >
                  {isEligible || isAppliedMode ? (
                    t("jobs.details.haveAllDocs")
                  ) : (
                    <Link href="/documents" className="hover:underline">
                      {t("jobs.details.missingDocs")}
                    </Link>
                  )}
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>

        {/* Desktop: sticky rail. Mobile: normal flow, actions pinned below. */}
        <aside className="mt-4 space-y-3 lg:sticky lg:top-20 lg:mt-0">
          <div className="hidden lg:block">{actions}</div>

          {showUsagePill ? (
            <p
              className={`rounded-md px-3 py-2 text-center text-sm font-bold ${
                usageSeverity === "critical"
                  ? "bg-danger-light text-danger-text"
                  : usageSeverity === "warning"
                    ? "bg-warning-light text-warning-text"
                    : "bg-primary-light text-primary"
              }`}
            >
              {t("jobs.details.applicationsUsed", { used: applicationsUsed, limit: applicationLimit })}
            </p>
          ) : null}

          {!isAppliedMode && blockReason ? (
            <Card className="border-secondary-tint bg-secondary-light text-center">
              <Icon name="lock" size={26} className="mx-auto text-secondary" />
              <p className="mt-2 text-lg font-bold text-heading">
                {t(UNLOCK_CARD_COPY[blockReason].title)}
              </p>
              <p className="mt-1 text-sm text-body">
                {t(UNLOCK_CARD_COPY[blockReason].subtitle, {
                  tier: blockReason === "tier" ? requiredTierLabel : nextTierLabel,
                })}
              </p>
              <Link
                href="/subscription"
                className="bg-gradient-secondary press mt-3 block rounded-md py-3 text-center text-md font-bold text-on-secondary shadow-sm"
              >
                {t("jobs.details.subscribe")}
              </Link>
            </Card>
          ) : null}

          {/* Refer hides on rejection — the app's `(!isAppliedMode || !isRejected)`. */}
          {!isAppliedMode || !isRejected ? (
            <Card className="border-line-mint text-center">
              <Icon name="user-circle" size={24} className="mx-auto text-primary" />
              <p className="mt-2 text-lg font-bold text-heading">{t("jobs.details.referTitle")}</p>
              <p className="mt-1 text-sm text-body">{t("jobs.details.referSubtitle")}</p>
              <Link
                href="/refer"
                className="press mt-3 block rounded-md border-[1.5px] border-primary py-2 text-center text-md font-semibold text-primary"
              >
                {t("jobs.details.referButton")}
              </Link>
            </Card>
          ) : null}
        </aside>
      </div>

      {/* Mobile action bar. `sticky bottom-0` rather than `fixed` so it sits in
          the document flow and cannot overlap the last card — and it clears the
          glass tab bar, which is itself fixed at bottom-4. */}
      <div className="glass sticky bottom-24 z-20 mt-4 rounded-xl p-3 shadow-float lg:hidden">
        {actions}
      </div>
    </div>
  );
}
