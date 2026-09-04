import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export const preferencesService = {
  getPreferences: async () => {
    const { data } = await apiClient.get(ENDPOINTS.USER.PREFERENCES);
    return data.data.preferredCategories || [];
  },

  updatePreferences: async (preferredCategories) => {
    const { data } = await apiClient.patch(ENDPOINTS.USER.PREFERENCES, { preferredCategories });
    return data.data.preferredCategories || [];
  },
};
