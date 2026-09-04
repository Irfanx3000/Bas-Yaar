import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { applicationService } from '../services/application.service';
import { APPLICATION_TABS, APPLICATIONS_PER_PAGE } from '../constants/applications.constants';
import { usePullToRefresh } from './usePullToRefresh';
import { useAppliedJobs } from '../context/AppliedJobsContext';
import { registerResource, revalidate } from '../store/dataSync';
import { showAlert } from '../utils/alertRef';
import { getErrorMessage } from '../i18n/getErrorMessage';

export function useApplicationsData() {
  const { t } = useTranslation();
  const { refresh: refreshAppliedJobs } = useAppliedJobs();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTabRaw] = useState(APPLICATION_TABS[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Reset to page 1 whenever the active tab changes
  const setActiveTab = useCallback((tabId) => {
    setActiveTabRaw(tabId);
    setCurrentPage(1);
  }, []);

  const loadData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsLoading(true);
    try {
      const data = await applicationService.getApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registered with the sync layer so this list recovers on its own after a
  // reconnect or a login, instead of holding whatever it failed to load until
  // the screen is remounted.
  useEffect(
    () => registerResource('applications', { refresh: () => loadData(false) }),
    [loadData],
  );

  // Refreshes the shared applied-jobs Set alongside the list: this screen and
  // every job card elsewhere in the app are two views of the same server
  // state, and refreshing one without the other is how they drift apart.
  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(
    useCallback(() => revalidate(['applications', 'appliedJobs'], 'pull-to-refresh'), []),
  );

  const handleWithdraw = useCallback(async (application) => {
    try {
      await applicationService.withdraw(application.id);
      // Withdrawing frees the job to be applied to again, so its card must go
      // back to showing Apply Now.
      refreshAppliedJobs();
      showAlert({
        type: 'success',
        title: t('applications.withdraw.successTitle'),
        message: t('applications.withdraw.successMessage', { title: application.title }),
      });
      await loadData(false);
    } catch (err) {
      showAlert({
        type: 'error',
        title: t('applications.withdraw.errorTitle'),
        message: getErrorMessage(err, t) || t('applications.withdraw.errorMessage'),
      });
    }
  }, [loadData, t, refreshAppliedJobs]);

  const counts = useMemo(() => {
    return APPLICATION_TABS.reduce((acc, tab) => {
      acc[tab.id] = tab.statuses
        ? applications.filter((a) => tab.statuses.includes(a.status)).length
        : applications.length;
      return acc;
    }, {});
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const tab = APPLICATION_TABS.find((tabItem) => tabItem.id === activeTab);
    if (!tab || !tab.statuses) return applications;
    return applications.filter((a) => tab.statuses.includes(a.status));
  }, [applications, activeTab]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredApplications.length / APPLICATIONS_PER_PAGE)),
    [filteredApplications],
  );

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * APPLICATIONS_PER_PAGE;
    return filteredApplications.slice(start, start + APPLICATIONS_PER_PAGE);
  }, [filteredApplications, currentPage]);

  // Keep the page in range when the result set shrinks under it — e.g. the last
  // item on page 2 gets withdrawn, which would otherwise leave a blank list.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    tabs: APPLICATION_TABS,
    activeTab,
    setActiveTab,
    counts,
    applications: paginatedApplications,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isRefreshing,
    handleRefresh,
    handleWithdraw,
  };
}
