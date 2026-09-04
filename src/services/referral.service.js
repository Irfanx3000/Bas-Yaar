import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Maps to CrewApply-backend's GET /user/referral.
//
// Response DTO: { code, shareMessage, walletBalance, stats: { invited, qualified,
//   rewarded }, history: [{ id, refereeName, status, rewardAmount, createdAt }] }
export const referralService = {
  getMyReferral: async () => {
    const { data } = await apiClient.get(ENDPOINTS.USER.REFERRAL);
    return data.data;
  },

  // Explicit "Generate Code" action — idempotent; returns the existing code
  // if one was already generated.
  generateCode: async () => {
    const { data } = await apiClient.post(ENDPOINTS.USER.REFERRAL_GENERATE);
    return data.data;
  },
};
