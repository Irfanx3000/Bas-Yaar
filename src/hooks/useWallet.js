import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { walletService } from '../services/wallet.service';
import { usePullToRefresh } from './usePullToRefresh';

const PAGE_SIZE = 20;

export function useWallet() {
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ totalCredited: 0, totalDebited: 0, pendingCredits: 0 });
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const load = useCallback(async (page = 1, { silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setLoadError(null);
    }
    try {
      const [wallet, history] = await Promise.all([
        walletService.getWallet(),
        walletService.getHistory({ page, limit: PAGE_SIZE }),
      ]);
      setBalance(wallet.balance);
      setStats(wallet.stats);
      setTransactions(history.transactions);
      setCurrentPage(history.pagination.page);
      setTotalPages(history.pagination.totalPages);
    } catch (err) {
      if (!silent) setLoadError(err?.message || 'Failed to load wallet.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(
    useCallback(() => load(currentPage, { silent: true }), [load, currentPage]),
  );

  const handlePageChange = useCallback((page) => {
    load(page);
  }, [load]);

  const handleSelectTransaction = useCallback(async (transaction) => {
    setDetailVisible(true);
    setIsLoadingDetail(true);
    try {
      const full = await walletService.getTransactionById(transaction._id);
      setSelectedTransaction(full);
    } catch {
      setSelectedTransaction(transaction); // fall back to the list row's own data
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailVisible(false);
  }, []);

  return {
    balance,
    stats,
    transactions,
    currentPage,
    totalPages,
    isLoading,
    isRefreshing,
    loadError,
    selectedTransaction,
    detailVisible,
    isLoadingDetail,
    handleRefresh,
    handlePageChange,
    handleSelectTransaction,
    closeDetail,
    reload: () => load(currentPage),
  };
}
