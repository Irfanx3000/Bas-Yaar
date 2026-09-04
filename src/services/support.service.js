import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export const supportService = {
  createInquiry: async ({ name, email, message }) => {
    const { data } = await apiClient.post(ENDPOINTS.SUPPORT.CREATE, { name, email, message });
    return data.data.inquiry;
  },
  // Unauthenticated variant — used when there's no session (logged out, or a
  // just-blocked account whose tokens were already cleared).
  createPublicInquiry: async ({ name, email, message }) => {
    const { data } = await apiClient.post(ENDPOINTS.SUPPORT.CREATE_PUBLIC, { name, email, message });
    return data.data.inquiry;
  },
};
