import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { applicationService } from '../services/application.service';
import { APPLICATION_STATUS } from '../constants/applications.constants';
import { useSyncedResource } from '../hooks/useSyncedResource';

// Which jobs the user has already applied to, shared app-wide — the exact
// counterpart of SavedJobsContext, and built the same way for the same reason.
//
// The Job Details screen learns this from a per-job eligibility call
// (useApplicationEligibility), which is fine for one job but impossible for a
// list — a screen of 10 cards would fire 10 requests. So the applications list
// is fetched once here and reduced to a Set of job ids, letting every JobCard
// answer "did I apply to this?" for free.
//
// This is also the cache that made the "I applied, but it still says Apply
// Now" report so persistent, and it is worth being precise about why, because
// the cause was structural rather than a missing call:
//
//   • The provider wraps NavigationContainer, so it mounts once per process
//     and never unmounts. Its single mount-time fetch was the ONLY load it
//     ever performed.
//   • That fetch runs before login (this provider wraps the Auth stack too),
//     finds no token, and yields an empty Set. Signing in did not re-run it.
//   • If the fetch failed — offline cold start — the empty Set was kept and
//     the failure forgotten, so nothing ever retried.
//   • Home's pull-to-refresh only refreshed Home's own three fetches, so
//     manually refreshing could not fix either case.
//
// Restarting the app was the only recovery, which is exactly what was
// reported. All four are now handled by useSyncedResource + dataSync: the
// resource is registered under 'appliedJobs', so login, reconnecting,
// returning from the background, and any pull-to-refresh all reach it.
const AppliedJobsContext = createContext({
  appliedJobIds: new Set(),
  isApplied: () => false,
  refresh: async () => {},
  refreshIfStale: async () => {},
});

// The backend caps its applications page at 50. A user past that many
// applications would see the oldest ones' cards fall back to "Apply Now" —
// still safe (applying again is blocked server-side with a clear duplicate
// error), just less informative.
const FETCH_LIMIT = 50;

// Module-level constant, not an inline []: useSyncedResource keeps this as the
// value it resets to on sign-out, and a fresh array each render would give
// every consumer a new identity to re-render on.
const EMPTY_IDS = [];

const fetchAppliedJobIds = async () => {
  const applications = await applicationService.getApplications({ limit: FETCH_LIMIT });
  return applications
    // Withdrawn frees the job up again, so it must NOT read as applied.
    .filter((a) => a.jobId && a.status !== APPLICATION_STATUS.WITHDRAWN)
    .map((a) => a.jobId);
};

export function AppliedJobsProvider({ children }) {
  const {
    data: ids,
    refresh,
    refreshIfStale,
    isFetching,
  } = useSyncedResource('appliedJobs', fetchAppliedJobIds, {
    initialData: EMPTY_IDS,
    // Applying happens on another device, or an admin withdraws one, without
    // this app hearing about it. A minute is short enough that a job card is
    // never meaningfully wrong for long, and long enough that switching
    // between Home and Jobs costs nothing.
    staleTime: 60000,
  });

  const appliedJobIds = useMemo(() => new Set(ids || EMPTY_IDS), [ids]);

  const isApplied = useCallback((jobId) => !!jobId && appliedJobIds.has(jobId), [appliedJobIds]);

  const value = useMemo(
    () => ({ appliedJobIds, isApplied, refresh, refreshIfStale, isFetching }),
    [appliedJobIds, isApplied, refresh, refreshIfStale, isFetching],
  );

  return <AppliedJobsContext.Provider value={value}>{children}</AppliedJobsContext.Provider>;
}

export const useAppliedJobs = () => useContext(AppliedJobsContext);
