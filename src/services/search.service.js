import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Maps to CrewApply-backend's GET /search — the same shared search engine
// used by the admin dashboard, scoped server-side to app-relevant entities
// (today: Jobs only).
// Response DTO: { groups: Array<{ entityType, count, results: Array<{ id, title, subtitle, navigable }> }> }
export const searchService = {
  search: async (query) => {
    const { data } = await apiClient.get(ENDPOINTS.SEARCH, { params: { q: query } });
    return data.data.groups;
  },
};
