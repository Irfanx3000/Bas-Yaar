import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { jobService } from '../services/job.service';
import { useSavedJobsContext } from '../context/SavedJobsContext';
import { useAppliedJobs } from '../context/AppliedJobsContext';
import { registerResource, revalidate } from '../store/dataSync';
import { useJobTaxonomyOptions } from './useJobTaxonomyOptions';
import { usePullToRefresh } from './usePullToRefresh';

const PAGE_SIZE = 10;

// How long to wait after the last chip tap before asking the server how many
// jobs the pending filter selection matches. Long enough that rattling through
// several chips costs one request, short enough that the count lands before the
// user reaches for the View button.
const PREVIEW_DEBOUNCE_MS = 350;

// Owns all Jobs screen state: the job list, server-side pagination, active
// search/filters, and bookmarks. Screens stay presentational.
//
// `initialCategory` (a category name, e.g. "Deck") seeds the very first load
// when arriving from the Home screen's Categories section. JobsScreen stays
// mounted across tab/stack navigations, so a SECOND category tap doesn't
// remount this hook — it must go through `setCategory` (see below), which
// JobsScreen calls whenever route.params.category changes after mount.
export function useJobsData(initialCategory) {
  const { isSaved, toggleSaved } = useSavedJobsContext();
  // Every card in this list asks AppliedJobsContext whether its job is already
  // applied to, so this screen is responsible for keeping that answer current.
  const { refreshIfStale: refreshAppliedIfStale } = useAppliedJobs();
  const { departmentOptions, vesselTypeOptions, categoryOptions } = useJobTaxonomyOptions();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [searchText, setSearchText] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedVesselTypes, setSelectedVesselTypes] = useState([]);
  // An ARRAY since the filter sheet made categories multi-select. The Home
  // screen still passes a single category name, which just seeds a 1-item list.
  const [selectedCategories, setSelectedCategories] = useState(initialCategory ? [initialCategory] : []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Count for the filter sheet's pending (not-yet-applied) selection — what its
  // "View N" button shows. null until the first preview resolves; the sheet
  // falls back to the current result count then.
  const [filterPreviewCount, setFilterPreviewCount] = useState(null);

  const fetchJobs = useCallback(async ({ page, search, departments, vesselTypes, category, showIndicator = true }) => {
    if (showIndicator) setIsLoading(true);
    setError(null);
    try {
      const { jobs: list, pagination: meta } = await jobService.getJobs({
        page,
        limit: PAGE_SIZE,
        search,
        departments,
        vesselTypes,
        category,
      });
      setJobs(list);
      setPagination(meta);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message || 'Failed to load jobs.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load only — subsequent loads are triggered explicitly by search/filter/page actions.
  useEffect(() => {
    fetchJobs({ page: 1, search: '', departments: [], vesselTypes: [], category: initialCategory || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchJobs]);

  // Held in a ref so the resource registered below always re-runs the CURRENT
  // query. Registering a closure over the filters directly would pin whatever
  // they were at registration time, and a reconnect would silently reset the
  // user's search back to page 1 of everything.
  const currentQueryRef = useRef({});
  currentQueryRef.current = {
    page: pagination.page,
    search: searchText,
    departments: selectedDepartments,
    vesselTypes: selectedVesselTypes,
    category: selectedCategories,
  };

  // Registered with the sync layer so a reconnect re-runs the query the user
  // is actually looking at. Without this, coming back online left the list
  // showing whatever it had failed to load, with only a manual pull to fix it.
  useEffect(
    () => registerResource('jobs', {
      refresh: () => fetchJobs({ ...currentQueryRef.current, showIndicator: false }),
    }),
    [fetchJobs],
  );

  // Pull-to-refresh goes through the registry, and refreshes the applied and
  // saved sets alongside the list — those drive the "Applied" badge and the
  // bookmark icon on every card here, so refreshing the list without them
  // repaints the same stale badges over fresh jobs.
  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(
    useCallback(
      () => revalidate(['jobs', 'appliedJobs', 'savedJobs'], 'pull-to-refresh'),
      [],
    ),
  );

  // Returning to this tab after applying to something (Job Details is a stack
  // screen pushed over it) must repaint that job's card. No-op while fresh.
  useFocusEffect(
    useCallback(() => {
      refreshAppliedIfStale();
    }, [refreshAppliedIfStale]),
  );

  const handleRetry = useCallback(() => {
    fetchJobs({
      page: pagination.page,
      search: searchText,
      departments: selectedDepartments,
      vesselTypes: selectedVesselTypes,
      category: selectedCategories,
    });
  }, [fetchJobs, pagination.page, searchText, selectedDepartments, selectedVesselTypes, selectedCategories]);

  const handlePageChange = useCallback((page) => {
    fetchJobs({ page, search: searchText, departments: selectedDepartments, vesselTypes: selectedVesselTypes, category: selectedCategories });
  }, [fetchJobs, searchText, selectedDepartments, selectedVesselTypes, selectedCategories]);

  const handleSearch = useCallback(({ keyword, location }) => {
    const term = [keyword, location].filter(Boolean).join(' ').trim();
    setSearchText(term);
    fetchJobs({ page: 1, search: term, departments: selectedDepartments, vesselTypes: selectedVesselTypes, category: selectedCategories });
  }, [fetchJobs, selectedDepartments, selectedVesselTypes, selectedCategories]);

  // Categories now come from the filter sheet alongside departments/vessel
  // types, so all three are applied in one go — a sheet that left the existing
  // category untouched would silently keep a Home-screen category applied that
  // the user just deselected there.
  const applyFilters = useCallback(({ departments = [], vesselTypes = [], categories = [] }) => {
    setSelectedDepartments(departments);
    setSelectedVesselTypes(vesselTypes);
    setSelectedCategories(categories);
    fetchJobs({ page: 1, search: searchText, departments, vesselTypes, category: categories });
  }, [fetchJobs, searchText]);

  // Clears every category filter without touching search/department/vessel-type
  // state — backs the dismissible category pills on the Jobs screen.
  const clearCategory = useCallback((value) => {
    const categories = value ? selectedCategories.filter((c) => c !== value) : [];
    setSelectedCategories(categories);
    fetchJobs({ page: 1, search: searchText, departments: selectedDepartments, vesselTypes: selectedVesselTypes, category: categories });
  }, [fetchJobs, searchText, selectedDepartments, selectedVesselTypes, selectedCategories]);

  // Applies a NEW category filter after mount (e.g. the user went back to
  // Home and tapped a different category card while Jobs was still mounted
  // in the stack/tab) — see JobsScreen's effect watching route.params.category.
  // Replaces rather than appends: tapping a Home category card means "show me
  // THIS category", not "add it to whatever I had".
  const setCategory = useCallback((category) => {
    const categories = category ? [category] : [];
    setSelectedCategories(categories);
    fetchJobs({ page: 1, search: searchText, departments: selectedDepartments, vesselTypes: selectedVesselTypes, category: categories });
  }, [fetchJobs, searchText, selectedDepartments, selectedVesselTypes]);

  // ── Filter-sheet preview count ──────────────────────────────────────────
  // The sheet's "View N" button used to show the CURRENT result count, which
  // is the count for the last APPLIED filters — so it sat there reading "4"
  // while the user ticked a dozen new chips. Jobs are paginated server-side,
  // so the real number for a pending selection can only come from the server:
  // ask for it with limit=1 (cheapest page that still returns pagination.total)
  // and keep only the newest response.
  const previewTimerRef = useRef(null);
  const previewSeqRef = useRef(0);

  const previewFilterCount = useCallback(({ departments = [], vesselTypes = [], categories = [] }) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    const seq = previewSeqRef.current + 1;
    previewSeqRef.current = seq;

    previewTimerRef.current = setTimeout(async () => {
      try {
        const { pagination: meta } = await jobService.getJobs({
          page: 1,
          limit: 1,
          search: searchText,
          departments,
          vesselTypes,
          category: categories,
        });
        // Guard against an earlier, slower request landing last and showing a
        // count for a selection the user has already moved past.
        if (seq === previewSeqRef.current) setFilterPreviewCount(meta.total);
      } catch {
        if (seq === previewSeqRef.current) setFilterPreviewCount(null);
      }
    }, PREVIEW_DEBOUNCE_MS);
  }, [searchText]);

  useEffect(() => () => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
  }, []);

  // Derived from the shared SavedJobsContext so Jobs always agrees with
  // Home/Job Details/Saved Jobs on which jobs are bookmarked.
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

  // What actually shows in the filter bar: the real department/vessel-type
  // selections applied via FilterJobsModal, as removable chips — not a
  // static, disconnected "Position / Salary / Experience" row that doesn't
  // correspond to any real filter the backend supports.
  const departmentLabels = useMemo(
    () => new Map(departmentOptions.map((d) => [d.value, d.label])),
    [departmentOptions],
  );
  const vesselTypeLabels = useMemo(
    () => new Map(vesselTypeOptions.map((v) => [v.value, v.label])),
    [vesselTypeOptions],
  );
  const appliedFilterChips = useMemo(() => [
    ...selectedDepartments.map((value) => ({
      id: `department:${value}`,
      type: 'department',
      value,
      label: departmentLabels.get(value) || value,
    })),
    ...selectedVesselTypes.map((value) => ({
      id: `vesselType:${value}`,
      type: 'vesselType',
      value,
      label: vesselTypeLabels.get(value) || value,
    })),
  ], [selectedDepartments, selectedVesselTypes, departmentLabels, vesselTypeLabels]);

  const removeFilter = useCallback(({ type, value }) => {
    const departments = type === 'department' ? selectedDepartments.filter((v) => v !== value) : selectedDepartments;
    const vesselTypes = type === 'vesselType' ? selectedVesselTypes.filter((v) => v !== value) : selectedVesselTypes;
    setSelectedDepartments(departments);
    setSelectedVesselTypes(vesselTypes);
    fetchJobs({ page: 1, search: searchText, departments, vesselTypes, category: selectedCategories });
  }, [fetchJobs, searchText, selectedDepartments, selectedVesselTypes, selectedCategories]);

  return {
    jobs,
    resultCount: pagination.total,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    appliedFilterChips,
    removeFilter,
    selectedDepartments,
    selectedVesselTypes,
    selectedCategories,
    clearCategory,
    setCategory,
    departmentOptions,
    vesselTypeOptions,
    categoryOptions,
    filterPreviewCount,
    previewFilterCount,
    bookmarkedJobs,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleRetry,
    handlePageChange,
    toggleBookmark,
    handleSearch,
    applyFilters,
  };
}
