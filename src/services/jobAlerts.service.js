import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { mapJobFromApi } from './job.service';

// Jobs the backend has already filtered down to ones this user's active
// subscription tier qualifies for (see job.service.js#listJobAlertsForUser
// on the backend — empty for a user with no active subscription, by design:
// this feed is "jobs regarding my plan", not the general listing).
export const jobAlertsService = {
  getAlerts: async ({ page, limit, search } = {}) => {
    const { data } = await apiClient.get(ENDPOINTS.JOB_ALERTS.LIST, {
      params: { page, limit, search: search || undefined },
    });
    return {
      jobs: (data.data.jobs || []).map(mapJobFromApi),
      pagination: data.meta?.pagination || { page: 1, limit: limit || 20, total: 0, totalPages: 1 },
    };
  },
};
