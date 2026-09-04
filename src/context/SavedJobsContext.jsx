import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { savedJobsService } from '../services/savedJobs.service';
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

  const toggleSaved = useCallback(async (job) => {
    if (!job?.id) return;
    const currentlySaved = savedJobIds.has(job.id);

    if (currentlySaved) {
      setSavedJobs((prev) => (prev || []).filter((j) => j.id !== job.id));
      try {
        await savedJobsService.removeSavedJob(job.id);
      } catch (err) {
        setSavedJobs((prev) => ((prev || []).some((j) => j.id === job.id) ? prev : [...(prev || []), job]));
        throw err;
      }
    } else {
      setSavedJobs((prev) => ((prev || []).some((j) => j.id === job.id) ? prev : [...(prev || []), job]));
      try {
        await savedJobsService.saveJob(job.id);
      } catch (err) {
        setSavedJobs((prev) => (prev || []).filter((j) => j.id !== job.id));
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
