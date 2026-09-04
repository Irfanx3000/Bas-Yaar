import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { jobService } from '../services/job.service';
import { applicationService } from '../services/application.service';
import { careerProfileService } from '../services/careerProfile.service';
import { useProfile } from '../context/ProfileContext';
import { useSubscriptionStatus } from '../context/SubscriptionContext';
import { useSavedJobsContext } from '../context/SavedJobsContext';
import { useAppliedJobs } from '../context/AppliedJobsContext';
import { registerResource, revalidate, revalidateAll } from '../store/dataSync';
import { usePullToRefresh } from './usePullToRefresh';
import { showAlert } from '../utils/alertRef';
import { getErrorMessage } from '../i18n/getErrorMessage';
import { ROUTES } from '../constants/routes.constants';

// Hard ceiling on any single Home request. Comfortably above apiClient's own
// 15s timeout, so it only fires for a request that never started its timer at
// all — e.g. one parked behind a stalled token refresh — rather than second-
// guessing a merely slow network.
const REQUEST_DEADLINE_MS = 20000;

export function useHomeData(navigation) {
  const { t } = useTranslation();
  // Read-only here: both contexts load themselves and are registered with
  // dataSync, so refreshing them is the sync layer's job, not this screen's.
  const { profile } = useProfile();
  const { isActive: hasSubscription, subscription, loading: subscriptionLoading } = useSubscriptionStatus();
  const { isSaved, toggleSaved, savedJobs } = useSavedJobsContext();
  // Home renders JobCards, and each card asks this context whether its job is
  // already applied to. Home therefore has to keep that answer fresh — the
  // card cannot do it for itself without every list item firing its own
  // request.
  const { refresh: refreshApplied, refreshIfStale: refreshAppliedIfStale } = useAppliedJobs();
  // Empty until real data arrives — the header shows a skeleton, never a fake name.
  const userName = profile?.firstName || profile?.name || '';

  // NOTE: the mount-time refreshProfile()/refreshSubscription() that used to
  // live here is gone. Both contexts load themselves on mount and are
  // registered with dataSync, so login (markSessionEstablished) and
  // reconnection now refresh them centrally — Home firing its own copies just
  // meant two requests for each on every cold start.
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [cvStatus, setCvStatus] = useState({ completionPercent: 0, lastUpdated: null });
  const [isLoading, setIsLoading] = useState(false);

  // Ref lets toggleBookmark read the latest jobs list without a stale closure.
  const featuredJobsRef = useRef([]);

  // Guards the auto-retry below to one attempt per FAILURE — re-armed on the
  // next fully successful load (see loadAllData) — so a genuinely-down backend
  // still settles instead of retrying forever, but a later, unrelated failure
  // gets its own retry rather than inheriting a spent one.
  const retriedAfterFailureRef = useRef(false);

  // Whether the most recent attempt left any section empty because its fetch
  // failed. Drives the on-focus recovery below, and is returned so the UI can
  // tell "nothing to show" apart from "couldn't load".
  const lastLoadFailedRef = useRef(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // When the last successful load finished — dataSync asks, to decide whether
  // returning from the background is worth a refetch.
  const lastLoadedAtRef = useRef(0);

  // Belt and braces around every request this screen makes.
  //
  // Promise.allSettled only settles once EVERY input does, so a single promise
  // that never resolves freezes the whole load — isLoading is never cleared and
  // the sections render neither content nor their empty state, which is what
  // "Featured Jobs just disappeared" actually looked like. axios' own timeout
  // does not cover every case (a request stalled inside an interceptor never
  // starts its timer), so each fetch gets an independent ceiling here. A
  // request that blows it is treated exactly like a rejection: that section
  // stays empty, the retry path engages, and the screen stays interactive.
  const withDeadline = useCallback((promise, label) => {
    let timer;
    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), REQUEST_DEADLINE_MS);
      }),
    ]);
  }, []);

  const loadAllData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsLoading(true);
    // Promise.allSettled, not Promise.all: these three are independent
    // sections of the Home screen (Featured Jobs, Recently Applied, CV
    // status) — with Promise.all, ONE of them failing (a slow/cold backend
    // request timing out, a transient network blip) rejected the whole
    // bundle, silently leaving ALL THREE at their empty initial state
    // instead of just the one that actually failed. Each section now only
    // goes empty if ITS OWN fetch failed.
    let hadFailure = false;
    try {
    const [jobsResult, appsResult, profileResult] = await Promise.allSettled([
      withDeadline(jobService.getFeaturedJobs(), 'featured jobs'),
      withDeadline(applicationService.getApplications({ limit: 3 }), 'recent applications'),
      withDeadline(careerProfileService.getCareerProfile(), 'career profile'),
    ]);

    if (jobsResult.status === 'fulfilled') {
      featuredJobsRef.current = jobsResult.value;
      setFeaturedJobs(jobsResult.value);
    } else {
      hadFailure = true;
      console.error('Error loading featured jobs:', jobsResult.reason);
    }

    if (appsResult.status === 'fulfilled') {
      setRecentApplications(appsResult.value);
    } else {
      hadFailure = true;
      console.error('Error loading recent applications:', appsResult.reason);
    }

    if (profileResult.status === 'fulfilled') {
      setCvStatus({
        completionPercent: profileResult.value.completion?.overall ?? 0,
        lastUpdated: profileResult.value.updatedAt,
      });
    } else {
      hadFailure = true;
      console.error('Error loading career profile:', profileResult.reason);
    }
    } catch (err) {
      // Nothing above is expected to throw — allSettled swallows rejections —
      // but if anything ever does, the screen must not be left stuck behind a
      // spinner with no content and no way back.
      hadFailure = true;
      console.error('Unexpected failure loading Home:', err);
    } finally {
      // In a `finally` on purpose. This flag gates whether the sections render
      // at all; if it is ever left true the screen shows blank panels forever,
      // which is precisely the bug this hook kept reproducing.
      setIsLoading(false);
    }

    lastLoadFailedRef.current = hadFailure;
    setLoadFailed(hadFailure);
    if (!hadFailure) lastLoadedAtRef.current = Date.now();

    // Re-arm the retry budget on a clean load. Without this the ref is a
    // one-shot for the LIFETIME of the hook, and since Home is a tab screen it
    // never unmounts — so a failure occurring at any point later in the
    // session had no automatic retry left at all.
    if (!hadFailure) retriedAfterFailureRef.current = false;

    // One silent automatic retry for a transient failure right after
    // mount/login — e.g. a freshly-issued auth token racing server-side
    // propagation, or a cold-start network blip (see api/client.js's own
    // comment on this exact class of bug: concurrent requests failing
    // together right after a token refresh). This is what was making
    // Featured Jobs/Recently Applied look like they'd silently vanished on
    // a fresh install, with no visible error and nothing to prompt a
    // manual pull-to-refresh. Bounded to once per mount so a genuinely
    // down backend still settles into a visible state instead of retrying
    // forever.
    if (hadFailure && !retriedAfterFailureRef.current) {
      retriedAfterFailureRef.current = true;
      setTimeout(() => {
        loadAllData(false);
      }, 1500);
    }
  }, [withDeadline]);

  // Register Home's own three fetches with the sync layer under 'home', so a
  // reconnect or a login re-runs them alongside every context — and, just as
  // importantly, so pull-to-refresh below can go through the registry and get
  // in-flight coalescing rather than firing a second copy of a load that is
  // already running.
  useEffect(
    () => registerResource('home', {
      refresh: () => loadAllData(false),
      isStale: () => lastLoadFailedRef.current || Date.now() - lastLoadedAtRef.current > 60000,
    }),
    [loadAllData],
  );

  // Pull-to-refresh now means what users have always assumed it meant:
  // re-fetch the app's server state, not just the three requests this screen
  // happens to own. Home renders job cards whose "Applied" badge lives in
  // AppliedJobsContext and an avatar that lives in ProfileContext — neither of
  // which the old refresh touched, which is exactly why pulling down never
  // fixed a card still showing "Apply Now". revalidateAll() covers home,
  // profile, appliedJobs, savedJobs and subscription in one pass, and
  // coalesces per resource so nothing is fetched twice.
  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(
    useCallback(() => revalidateAll('pull-to-refresh'), []),
  );

  // Derived from the shared SavedJobsContext so Home always agrees with
  // Jobs/Job Details/Saved Jobs on which jobs are bookmarked.
  const bookmarkedJobs = useMemo(() => {
    const map = {};
    featuredJobs.forEach((j) => {
      if (isSaved(j.id)) map[j.id] = true;
    });
    return map;
  }, [featuredJobs, isSaved]);

  const toggleBookmark = useCallback((jobId) => {
    const job = featuredJobsRef.current.find((j) => j.id === jobId);
    if (job) toggleSaved(job).catch(() => {});
  }, [toggleSaved]);

  const handleSearch = useCallback(({ keyword, location }) => {
    const term = [keyword, location].filter(Boolean).join(' ').trim();
    if (!term) return;
    navigation?.navigate(ROUTES.SEARCH_RESULTS, { query: term });
  }, [navigation]);

  const handleWithdrawApplication = useCallback(async (application) => {
    try {
      await applicationService.withdraw(application.id);
      showAlert({
        type: 'success',
        title: t('applications.withdraw.successTitle'),
        message: t('applications.withdraw.successMessage', { title: application.title }),
      });
      // Withdrawing frees the job to be applied to again, so the shared
      // applied-jobs Set is now wrong too — its card must go back to showing
      // "Apply Now". Refreshing only this screen's own list would leave the
      // card on Home and Jobs still reading "Applied".
      await Promise.all([loadAllData(false), refreshApplied()]);
    } catch (err) {
      showAlert({
        type: 'error',
        title: t('applications.withdraw.errorTitle'),
        message: getErrorMessage(err, t) || t('applications.withdraw.errorMessage'),
      });
    }
  }, [loadAllData, refreshApplied, t]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Recovery on re-focus. Home is a TAB screen: React Navigation keeps it
  // mounted for the whole session, so its mount effect runs exactly once and
  // the single post-failure retry above was the only automatic second chance
  // the app ever got. If both missed — a cold backend, a tunnel, a 15s
  // timeout — the sections stayed empty until the process was killed and
  // relaunched, which is exactly the "it fixes itself if I close and reopen
  // the app" report.
  //
  // Only re-fetches when the last attempt actually failed, and silently (no
  // spinner), so normal tab switching costs nothing and never flashes.
  // Routed through the registry rather than calling loadAllData directly, so
  // it coalesces with a reconnect or foreground sweep that may already be
  // re-fetching this exact resource — two concurrent loads of Home is three
  // duplicate requests against a rate limiter shared by the whole app.
  useFocusEffect(
    useCallback(() => {
      if (lastLoadFailedRef.current) revalidate('home', 'focus');
      // Independent of the above: the applied-jobs Set can be stale even when
      // Home's own load succeeded — the user may have just applied to a job on
      // the Jobs tab, or withdrawn one, or applied on another device. This is
      // a no-op while it is fresh (see useSyncedResource#refreshIfStale), so
      // ordinary tab switching still costs nothing.
      refreshAppliedIfStale();
    }, [refreshAppliedIfStale]),
  );

  // Second recovery trigger: returning from the background. Home is the
  // initial route, so on a cold start it is ALREADY focused — the focus effect
  // above runs before the first load has failed and then never fires again
  // unless the user navigates away and back. Someone who opens the app, sees
  // empty sections and simply switches apps and returns would otherwise get
  // nothing. Backgrounding is also exactly when a stalled socket dies, so this
  // is the moment a retry is most likely to succeed.
  //
  // Narrower than dataSync's own foreground trigger, which only engages after
  // the app has been away for 30s: a failed load must be retried however
  // briefly the user stepped out. Same registry routing as above so the two
  // never fire duplicate requests.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && lastLoadFailedRef.current) revalidate('home', 'foreground');
    });
    return () => sub.remove();
  }, []);

  return {
    userName,
    featuredJobs,
    recentApplications,
    cvStatus,
    savedJobsCount: savedJobs.length,
    hasSubscription,
    subscription,
    subscriptionLoading,
    isLoading,
    isRefreshing,
    // True when a section is empty because its fetch FAILED, not because there
    // is genuinely nothing to show. Lets the UI offer a retry instead of the
    // misleading "you haven't applied to any jobs yet" copy.
    loadFailed,
    bookmarkedJobs,
    handleRefresh,
    toggleBookmark,
    handleSearch,
    handleWithdrawApplication,
  };
}
