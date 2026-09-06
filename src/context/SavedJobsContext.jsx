import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { savedJobsService } from '../services/savedJobs.service';
import { showToast } from '../utils/toastRef';
import { useSyncedResource } from '../hooks/useSyncedResource';

// Single source of truth for saved/bookmarked jobs — Home, Jobs, Job Details,
// and Saved Jobs all read/write through here so toggling a bookmark anywhere
// shows up everywhere else instantly, instead of each screen keeping its own
// disconnected local state.
//
// Same cold-start failure mode as AppliedJobsContext (see the long note
// there): one fetch on mount, before login, with no retry. Now registered
// with dataSync under 'savedJobs'.
const SavedJobsContext = createContext({
  savedJobs: [],
  loading: false,
  isSaved: () => false,
  toggleSaved: async () => {},
  refresh: async () => {},
  refreshIfStale: async () => {},
});

const EMPTY_JOBS = [];

export function SavedJobsProvider({ children }) {
  const {
    data: savedJobs,
    setData: setSavedJobs,
    refresh,
    refreshIfStale,
    isFetching,
  } = useSyncedResource('savedJobs', savedJobsService.getSavedJobs, {
    initialData: EMPTY_JOBS,
    staleTime: 60000,
  });

  const savedJobIds = useMemo(() => new Set((savedJobs || EMPTY_JOBS).map((j) => j.id)), [savedJobs]);
  const isSaved = useCallback((jobId) => savedJobIds.has(jobId), [savedJobIds]);

  // ── WEB-ONLY: toast feedback ────────────────────────────────────────────────
  // Every save and unsave in the product routes through this one function —
  // JobCard's bookmark on /jobs, /alerts, /dashboard and /saved, plus the Job
  // Details button. So the confirmation belongs HERE, not repeated at five call
  // sites where it would drift apart.
  //
  // It also fixes a silent failure. The optimistic update reverts and rethrows
  // on error, but every caller swallows it with `.catch(() => {})` — so a failed
  // save currently just made the bookmark quietly snap back with no explanation.
  const toggleSaved = useCallback(async (job) => {
    if (!job?.id) return;
    const currentlySaved = savedJobIds.has(job.id);

    if (currentlySaved) {
      setSavedJobs((prev) => (prev || []).filter((j) => j.id !== job.id));
      try {
        await savedJobsService.removeSavedJob(job.id);
        showToast({ message: 'Removed from saved jobs', tone: 'info', icon: 'bookmark' });
      } catch (err) {
        setSavedJobs((prev) => ((prev || []).some((j) => j.id === job.id) ? prev : [...(prev || []), job]));
        showToast({ message: 'Could not remove that job. Try again.', tone: 'error' });
        throw err;
      }
    } else {
      setSavedJobs((prev) => ((prev || []).some((j) => j.id === job.id) ? prev : [...(prev || []), job]));
      try {
        await savedJobsService.saveJob(job.id);
        showToast({ message: 'Saved to your jobs', tone: 'success', icon: 'bookmark' });
      } catch (err) {
        setSavedJobs((prev) => (prev || []).filter((j) => j.id !== job.id));
        showToast({ message: 'Could not save that job. Try again.', tone: 'error' });
        throw err;
      }
    }
  }, [savedJobIds, setSavedJobs]);

  const value = useMemo(
    () => ({
      savedJobs: savedJobs || EMPTY_JOBS,
      loading: isFetching,
      isSaved,
      toggleSaved,
      refresh,
      refreshIfStale,
    }),
    [savedJobs, isFetching, isSaved, toggleSaved, refresh, refreshIfStale],
  );

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>;
}

export const useSavedJobsContext = () => useContext(SavedJobsContext);
