import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Wallet transaction DTO (as returned by the API):
// { _id, referenceId, status, type, amount, balanceAfter, referral, payment,
//   description, createdBy, createdAt, updatedAt }
// `amount` is signed paise — positive = credit, negative = debit.
export const walletService = {
  // { balance, stats: { totalCredited, totalDebited, pendingCredits }, recentTransactions }
  async getWallet() {
    const { data } = await apiClient.get(ENDPOINTS.WALLET.GET);
    return data.data;
  },

  async getHistory({ page = 1, limit = 20 } = {}) {
    const { data } = await apiClient.get(ENDPOINTS.WALLET.HISTORY, { params: { page, limit } });
    return {
      transactions: data.data.transactions || [],
      pagination: data.meta?.pagination || { page: 1, limit, total: 0, totalPages: 1 },
    };
  },

  async getTransactionById(id) {
    const { data } = await apiClient.get(ENDPOINTS.WALLET.DETAIL(id));
    return data.data.transaction;
  },
};
