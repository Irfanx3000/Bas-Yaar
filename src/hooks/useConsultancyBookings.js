import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { consultancyService } from '../services/consultancy.service';
import { usePullToRefresh } from './usePullToRefresh';

// A user's own consultancy history is small by nature (at most a handful of
// sessions) — one generous-limit fetch, no pagination UI needed.
const PAGE_SIZE = 50;

export function useConsultancyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsLoading(true);
    try {
      const { bookings: list } = await consultancyService.getMyBookings({ page: 1, limit: PAGE_SIZE });
      setBookings(list);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(
    useCallback(() => load(false), [load]),
  );

  return { bookings, isLoading, isRefreshing, handleRefresh };
}
