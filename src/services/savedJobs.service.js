import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { mapJobFromApi } from './job.service';

export const savedJobsService = {
  getSavedJobs: async () => {
    const { data } = await apiClient.get(ENDPOINTS.SAVED_JOBS.LIST);
    return (data.data.jobs || []).map(mapJobFromApi);
  },

  saveJob: async (jobId) => {
    await apiClient.post(ENDPOINTS.SAVED_JOBS.SAVE(jobId));
  },

  removeSavedJob: async (jobId) => {
    await apiClient.delete(ENDPOINTS.SAVED_JOBS.REMOVE(jobId));
  },
};
