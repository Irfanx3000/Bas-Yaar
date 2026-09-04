import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const formatLocation = (location) => {
  if (!location) return '';
  const { city, country } = location;
  return city && country ? `${city}, ${country}` : city || country || '';
};

const formatAppliedDate = (iso) => {
  if (!iso) return '';
  const formatted = new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `Applied on ${formatted}`;
};

// Adapts a backend Application record (with populated `job`) into the exact
// shape ApplicationCard.jsx/useApplicationsData.js already expect, so those
// components don't need to change.
export const mapApplicationFromApi = (apiApplication) => {
  if (!apiApplication) return null;
  const job = apiApplication.job;
  return {
    id: apiApplication.id,
    // The JOB's id, not the application's — AppliedJobsContext keys its
    // "already applied" lookup on this so job cards can show the right state.
    jobId: job?.id || null,
    title: job?.title || '[Job removed]',
    location: formatLocation(job?.location),
    logo: job?.companyLogoUrl || null,
    status: apiApplication.status,
    dateText: formatAppliedDate(apiApplication.appliedAt),
    appliedAt: apiApplication.appliedAt,
  };
};

export const applicationService = {
  getApplications: async ({ status, page, limit } = {}) => {
    const { data } = await apiClient.get(ENDPOINTS.APPLICATIONS.LIST, { params: { status, page, limit } });
    return (data.data.applications || []).map(mapApplicationFromApi);
  },

  getApplicationById: async (id) => {
    const { data } = await apiClient.get(ENDPOINTS.APPLICATIONS.DETAIL(id));
    return mapApplicationFromApi(data.data.application);
  },

  apply: async (jobId) => {
    const { data } = await apiClient.post(ENDPOINTS.APPLICATIONS.CREATE, { jobId });
    return mapApplicationFromApi(data.data.application);
  },

  withdraw: async (id) => {
    const { data } = await apiClient.post(ENDPOINTS.APPLICATIONS.WITHDRAW(id));
    return mapApplicationFromApi(data.data.application);
  },

  getEligibility: async (jobId) => {
    const { data } = await apiClient.get(ENDPOINTS.APPLICATIONS.ELIGIBILITY(jobId));
    return data.data.eligibility;
  },
};
