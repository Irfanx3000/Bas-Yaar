import { useState, useEffect, useCallback, useMemo } from 'react';
import { jobAlertsService } from '../services/jobAlerts.service';
import { useSavedJobsContext } from '../context/SavedJobsContext';
import { usePullToRefresh } from './usePullToRefresh';

const PAGE_SIZE = 10;

// Owns the "Job Alerts" feed: server-side pagination + search over jobs the
// backend already filtered to this user's subscription tier (see
// jobAlerts.service.js) — mirrors useJobsData.js's shape so JobAlertsScreen
// can reuse the same JobCard/Pagination/AnimatedListItem pieces as Jobs/Saved Jobs.
export function useJobAlerts() {
  const { isSaved, toggleSaved } = useSavedJobsContext();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async ({ page = 1, search = '', showIndicator = true } = {}) => {
    if (showIndicator) setIsLoading(true);
    setError(null);
    try {
      const { jobs: list, pagination: meta } = await jobAlertsService.getAlerts({ page, limit: PAGE_SIZE, search });
      setJobs(list);
      setPagination(meta);
    } catch (err) {
      console.error('Error loading job alerts:', err);
      setError(err.message || 'Failed to load job alerts.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts({ page: 1, search: '' });
  }, [fetchAlerts]);

  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(
    useCallback(() => fetchAlerts({ page: 1, search: searchKeyword, showIndicator: false }), [fetchAlerts, searchKeyword]),
  );

  const handleSearch = useCallback((keyword) => {
    setSearchKeyword(keyword);
    fetchAlerts({ page: 1, search: keyword });
  }, [fetchAlerts]);

  const handlePageChange = useCallback((page) => {
    fetchAlerts({ page, search: searchKeyword });
  }, [fetchAlerts, searchKeyword]);

  // Derived from the shared SavedJobsContext so Job Alerts always agrees
  // with Home/Jobs/Saved Jobs on which jobs are bookmarked.
  const bookmarkedJobs = useMemo(() => {
    const map = {};
    jobs.forEach((j) => {
      if (isSaved(j.id)) map[j.id] = true;
    });
    return map;
  }, [jobs, isSaved]);

  const toggleBookmark = useCallback((jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) toggleSaved(job).catch(() => {});
  }, [jobs, toggleSaved]);

  return {
    jobs,
    totalCount: pagination.total,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    searchKeyword,
    bookmarkedJobs,
    isLoading,
    isRefreshing,
    error,
    handleSearch,
    handlePageChange,
    handleRefresh,
    toggleBookmark,
  };
}
