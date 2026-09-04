"use client";

/* Job details — the app's biggest screen (1,493 LOC), from the screenshot.
 *
 * Order preserved from the app: hero, title card, eligibility banner,
 * Overview/Requirements tabs, documents required, the subscribe gate, refer,
 * then a pinned Save / Apply bar.
 *
 * Eligibility is server-computed and this only displays it — the backend runs
 * the same check at apply time, so nothing is recomputed here. Its exact shape
 * (read before writing this file, per the Block B lesson):
 *   eligible · hasActiveSubscription · hasRequiredDocuments · requiredDocuments
 *   missingDocuments · jobIsOpen · alreadyApplied · meetsTierRequirement
 *   jobMinimumTier · userTier · applicationsUsed · applicationLimit
 *   applicationsRemaining
 *
 * Responsive: the app scrolls one column and pins the actions to the bottom.
 * On desktop the apply/refer/subscribe cards move into a sticky right rail, so
 * the CTA is visible without scrolling and the description gets a readable
 * measure instead of spanning the full width.
 */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jobService } from "@/services/job.service";
import { applicationService } from "@/services/application.service";
import { useApplicationEligibility } from "@/hooks/useApplicationEligibility";
import { useSavedJobsContext } from "@/context/SavedJobsContext";
import { useAppliedJobs } from "@/context/AppliedJobsContext";
import { getErrorMessage } from "@/i18n/getErrorMessage";
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

function DocumentTile({ name, missing }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-md border p-3 text-center ${
        missing ? "border-danger/30 bg-danger-light" : "border-success/30 bg-success-light"
      }`}
    >
      <Icon name={missing ? "exclamation-circle" : "file-alt"} size={20} className={missing ? "text-danger" : "text-success"} />
      <span className="text-xs font-semibold text-heading capitalize">{name}</span>
    </div>
  );
}

export default function JobDetailsPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);

  const eligibility = useApplicationEligibility(id);
  /* Method names verified against the contexts, not assumed:
       SavedJobsContext  → { savedJobs, isFetching, isSaved, toggleSaved, refresh, refreshIfStale }
                            toggleSaved takes the JOB OBJECT, not an id
       AppliedJobsContext → { appliedJobIds, isApplied, refresh, refreshIfStale, isFetching }
                            there is no markApplied — refresh() after applying */
  const { isSaved, toggleSaved } = useSavedJobsContext();
  const { isApplied, refresh: refreshApplied } = useAppliedJobs();

  /* No synchronous setState here. `loading` starts true, so the first render is
     already the loading state and the effect does not have to set it — a
     setState that fires synchronously inside an effect is the cascading-render
     pattern React Compiler flags. The retry path re-arms it from an event
     handler instead, which is allowed and is the only place it is needed. */
  const load = useCallback(async () => {
    try {
      // Every state write happens AFTER the first await. `setError(null)` used to
      // run before it, which makes the call synchronous from the effect's point
      // of view even though the function is async — that is the distinction the
      // rule is actually drawing.
      const next = await jobService.getJobById(id);
      setJob(next);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const retry = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect --
       `load` is async and writes no state before its first await, so this does
       not actually cascade — the rule cannot prove that across a call boundary
       and flags every fetch-on-mount. Fetching in an effect is legitimate for a
       client component.
       The better answer is to stop fetching this on the client at all:
       GET /jobs/:id is public (verified in Phase 0), so in Phase 5 this route
       becomes a server component that fetches the job and passes it to a small
       client child for the interactive parts. That removes the effect rather
       than silencing it, and makes the page indexable at the same time. */
    load();
  }, [load]);

  const applied = eligibility.alreadyApplied || isApplied?.(id);

  const onApply = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      await applicationService.apply(id);
      // The context has no local "mark applied" — refetch so every screen that
      // reads it (job cards, Home, Applications) agrees immediately.
      await refreshApplied?.();
      eligibility.refresh?.();
    } catch (err) {
      setApplyError(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-[15px] py-6 lg:px-6">
        <LoadingState rows={3} />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-5xl px-[15px] py-6 lg:px-6">
        <ErrorState message={error || "That job could not be found."} onRetry={retry} />
      </div>
    );
  }

  const canApply = eligibility.eligible && !applied;

  return (
    <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
      {/* Hero. Jobs carry no photo field, so this is the app's header gradient
          rather than a stock image — honest, and it never breaks. */}
      <div className="bg-gradient-header relative flex h-40 items-end overflow-hidden rounded-xl p-4 sm:h-52">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="glass absolute top-4 left-4 flex size-10 items-center justify-center rounded-round text-heading shadow-float"
        >
          <Icon name="chevron-left" size={14} />
        </button>
        {job.isFeatured ? <StatusBadge status="featured" /> : null}
      </div>

      <Card radius="lg" className="-mt-8 relative mx-2 flex flex-wrap items-start justify-between gap-3" elevation="md">
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
      </Card>

      <div className="mt-4 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-6">
        <div className="min-w-0">
          {!eligibility.loading ? (
            <InlineAlert
              tone={applied ? "info" : eligibility.eligible ? "success" : "warning"}
              title={
                applied
                  ? "You have already applied"
                  : eligibility.eligible
                    ? "You're eligible to apply for this job"
                    : "You can't apply yet"
              }
            >
              {applied
                ? "Track its progress from My Applications."
                : eligibility.eligible
                  ? "Great — you meet the requirements."
                  : !eligibility.hasActiveSubscription
                    ? "An active subscription is needed to apply."
                    : !eligibility.hasRequiredDocuments
                      ? `Missing: ${eligibility.missingDocuments.join(", ")}`
                      : !eligibility.meetsTierRequirement
                        ? `This job needs the ${eligibility.jobMinimumTier} plan.`
                        : !eligibility.jobIsOpen
                          ? "This job is no longer accepting applications."
                          : "Check the requirements below."}
            </InlineAlert>
          ) : null}

          <Tabs
            className="mt-4"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "requirements", label: "Requirements" },
            ]}
          />

          {tab === "overview" ? (
            <Card className="mt-4">
              <h2 className="text-lg font-bold text-heading">About the job</h2>
              <p className="mt-2 max-w-prose whitespace-pre-line text-md text-body">
                {job.description || "No description was provided for this position."}
              </p>

              {job.responsibilities?.length ? (
                <>
                  <h3 className="mt-4 text-md font-bold text-heading">Responsibilities</h3>
                  <ul className="mt-2 max-w-prose list-disc space-y-1 pl-5 text-md text-body">
                    {job.responsibilities.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {job.benefits?.length ? (
                <>
                  <h3 className="mt-4 text-md font-bold text-heading">Benefits</h3>
                  <ul className="mt-2 max-w-prose list-disc space-y-1 pl-5 text-md text-body">
                    {job.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </Card>
          ) : (
            <Card className="mt-4">
              <h2 className="text-lg font-bold text-heading">Requirements</h2>
              {job.requirements?.length ? (
                <ul className="mt-2 max-w-prose list-disc space-y-1 pl-5 text-md text-body">
                  {job.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-md text-body">No specific requirements were listed.</p>
              )}

              {job.requiredSkills?.length ? (
                <>
                  <h3 className="mt-4 text-md font-bold text-heading">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-[5px]">
                    {job.requiredSkills.map((s) => (
                      <Chip key={s}>{s}</Chip>
                    ))}
                  </div>
                </>
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

          {eligibility.requiredDocuments?.length ? (
            <Card className="mt-4">
              <h2 className="text-lg font-bold text-heading">Documents required</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {eligibility.requiredDocuments.map((doc) => (
                  <DocumentTile key={doc} name={doc} missing={eligibility.missingDocuments?.includes(doc)} />
                ))}
              </div>
              <p className={`mt-3 text-sm font-semibold ${eligibility.hasRequiredDocuments ? "text-primary" : "text-danger"}`}>
                {eligibility.hasRequiredDocuments ? (
                  "You have all required documents for this position."
                ) : (
                  <Link href="/documents" className="hover:underline">
                    Upload the missing documents →
                  </Link>
                )}
              </p>
            </Card>
          ) : null}
        </div>

        {/* Sticky rail on desktop; falls back to normal flow on mobile, where the
            bar at the bottom of the page carries the same actions. */}
        <aside className="mt-4 space-y-3 lg:sticky lg:top-20 lg:mt-0">
          {applyError ? <InlineAlert tone="error">{applyError}</InlineAlert> : null}

          {!eligibility.hasActiveSubscription && !applied ? (
            <Card className="border-secondary-tint bg-secondary-light text-center">
              <Icon name="lock" size={26} className="mx-auto text-secondary" />
              <p className="mt-2 text-lg font-bold text-heading">Unlock to apply for this job</p>
              <p className="mt-1 text-sm text-body">Subscribe to any plan to apply for unlimited jobs.</p>
              <Link
                href="/subscription"
                className="bg-gradient-secondary press mt-3 block rounded-md py-3 text-center text-md font-bold text-on-secondary shadow-sm"
              >
                Subscribe
              </Link>
            </Card>
          ) : (
            <Card className="flex flex-col gap-2">
              <Button fullWidth loading={applying} disabled={!canApply} icon="paper-plane" onClick={onApply}>
                {applied ? "Applied" : "Apply now"}
              </Button>
              <Button
                fullWidth
                variant="outline"
                icon="bookmark"
                onClick={() => toggleSaved(job)}
              >
                {isSaved?.(job.id) ? "Saved" : "Save job"}
              </Button>
              {eligibility.applicationsRemaining != null ? (
                <p className="text-center text-sm text-hint">
                  {eligibility.applicationsRemaining} applications left this month
                </p>
              ) : null}
            </Card>
          )}

          <Card className="border-line-mint text-center">
            <Icon name="user-circle" size={24} className="mx-auto text-primary" />
            <p className="mt-2 text-lg font-bold text-heading">Refer this job</p>
            <p className="mt-1 text-sm text-body">
              Help your friends discover cruise opportunities and start their journey at sea.
            </p>
            <Link
              href="/refer"
              className="press mt-3 block rounded-md border-[1.5px] border-primary py-2 text-center text-md font-semibold text-primary"
            >
              Refer this job
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
