import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Public endpoint — no auth needed, matches jobs/document-types.
export const bannerService = {
  getBanners: async () => {
    const { data } = await apiClient.get(ENDPOINTS.BANNERS.LIST);
    return data.data.banners || [];
  },
};
