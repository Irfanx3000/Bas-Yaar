import { useState, useCallback, useMemo } from 'react';
import { useSavedJobsContext } from '../context/SavedJobsContext';
import { useJobTaxonomyOptions } from './useJobTaxonomyOptions';
import { usePullToRefresh } from './usePullToRefresh';
import { SAVED_JOBS_CONFIG } from '../constants/savedJobs.constants';

export function useSavedJobs() {
  const { savedJobs: allJobs, loading: isLoading, toggleSaved, refresh } = useSavedJobsContext();
  const { departmentOptions, vesselTypeOptions, categoryOptions } = useJobTaxonomyOptions();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedVesselTypes, setSelectedVesselTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(refresh);

  const handleSearch = useCallback((keyword) => {
    setSearchKeyword(keyword);
    setCurrentPage(1);
  }, []);

  const handleRemoveJob = useCallback(async (jobId) => {
    const job = allJobs.find((j) => j.id === jobId);
    if (job) await toggleSaved(job).catch(() => {});
  }, [allJobs, toggleSaved]);

  const applyFilters = useCallback(({ departments = [], vesselTypes = [], categories = [] }) => {
    setSelectedDepartments(departments);
    setSelectedVesselTypes(vesselTypes);
    setSelectedCategories(categories);
    setCurrentPage(1);
  }, []);

  // One matcher, used both for the visible list and for the filter sheet's
  // "View N" preview — so the number on the button is computed exactly the
  // same way as the list it promises, and can never disagree with it.
  const matchJobs = useCallback(
    (jobs, { departments, vesselTypes, categories }) => {
      let result = jobs;
      if (searchKeyword.trim()) {
        const lower = searchKeyword.toLowerCase();
        result = result.filter(
          (j) => j.title.toLowerCase().includes(lower) || j.location.toLowerCase().includes(lower),
        );
      }
      if (departments.length) result = result.filter((j) => departments.includes(j.department));
      if (vesselTypes.length) result = result.filter((j) => vesselTypes.includes(j.vesselType));
      if (categories.length) result = result.filter((j) => categories.includes(j.category));
      return result;
    },
    [searchKeyword],
  );

  // Filter in-memory — the full saved list already lives in context, so
  // search + department/vessel-type/category all narrow the same in-memory
  // array rather than round-tripping to the server.
  const filteredJobs = useMemo(
    () => matchJobs(allJobs, {
      departments: selectedDepartments,
      vesselTypes: selectedVesselTypes,
      categories: selectedCategories,
    }),
    [matchJobs, allJobs, selectedDepartments, selectedVesselTypes, selectedCategories],
  );

  // Unlike the Jobs screen (server-paginated, so its preview needs a network
  // round-trip), everything here is already in memory — the count for a pending
  // selection is just the matcher run again, synchronously.
  const [filterPreviewCount, setFilterPreviewCount] = useState(null);
  const previewFilterCount = useCallback(
    (selection) => setFilterPreviewCount(matchJobs(allJobs, selection).length),
    [matchJobs, allJobs],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredJobs.length / SAVED_JOBS_CONFIG.ITEMS_PER_PAGE)),
    [filteredJobs],
  );

  // Clamp page so removing the last item on a page auto-steps back.
  const clampedPage = useMemo(
    () => Math.min(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const paginatedJobs = useMemo(() => {
    const start = (clampedPage - 1) * SAVED_JOBS_CONFIG.ITEMS_PER_PAGE;
    return filteredJobs.slice(start, start + SAVED_JOBS_CONFIG.ITEMS_PER_PAGE);
  }, [filteredJobs, clampedPage]);

  // What actually shows in the filter bar: the real applied department/
  // vessel-type selections, as removable chips.
  const departmentLabels = useMemo(
    () => new Map(departmentOptions.map((d) => [d.value, d.label])),
    [departmentOptions],
  );
  const vesselTypeLabels = useMemo(
    () => new Map(vesselTypeOptions.map((v) => [v.value, v.label])),
    [vesselTypeOptions],
  );
  const appliedFilterChips = useMemo(() => [
    ...selectedCategories.map((value) => ({
      id: `category:${value}`,
      type: 'category',
      value,
      label: value,
    })),
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
  ], [selectedCategories, selectedDepartments, selectedVesselTypes, departmentLabels, vesselTypeLabels]);

  const removeFilter = useCallback(({ type, value }) => {
    if (type === 'department') setSelectedDepartments((prev) => prev.filter((v) => v !== value));
    if (type === 'vesselType') setSelectedVesselTypes((prev) => prev.filter((v) => v !== value));
    if (type === 'category') setSelectedCategories((prev) => prev.filter((v) => v !== value));
    setCurrentPage(1);
  }, []);

  return {
    jobs: paginatedJobs,
    matchingJobs: filteredJobs,
    totalCount: filteredJobs.length,
    searchKeyword,
    currentPage: clampedPage,
    totalPages,
    isLoading,
    isRefreshing,
    selectedDepartments,
    selectedVesselTypes,
    selectedCategories,
    departmentOptions,
    vesselTypeOptions,
    categoryOptions,
    appliedFilterChips,
    filterPreviewCount,
    previewFilterCount,
    removeFilter,
    applyFilters,
    handleSearch,
    handleRemoveJob,
    handleRefresh,
    setCurrentPage,
  };
}
