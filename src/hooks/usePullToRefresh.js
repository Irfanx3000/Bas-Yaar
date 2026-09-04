import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showAlert } from '../utils/alertRef';
import { getErrorMessage } from '../i18n/getErrorMessage';

// Single shared pull-to-refresh implementation for every post-auth screen —
// wraps a screen's own refresh callback with the three things every one of
// them needs and previously reimplemented ad hoc: the `refreshing` flag
// RefreshControl/ScreenContainer expect, a guard against a second pull
// firing while one is already in flight, and a non-intrusive error toast so
// a failed refresh stops the spinner without clearing whatever's already on
// screen (the screen's own state is left untouched — only its own refreshFn
// decides what, if anything, to update).
//
// Usage: const { refreshing, onRefresh } = usePullToRefresh(refreshFn);
// then pass both straight to <ScreenContainer refreshing={refreshing}
// onRefresh={onRefresh} /> (scrollable screens) or a <RefreshControl
// refreshing={refreshing} onRefresh={onRefresh} /> (screens managing their
// own ScrollView/FlatList).
export function usePullToRefresh(refreshFn) {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  const onRefresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setRefreshing(true);
    try {
      await refreshFn();
    } catch (err) {
      showAlert({ type: 'error', title: t('common.error'), message: getErrorMessage(err, t) });
    } finally {
      setRefreshing(false);
      inFlightRef.current = false;
    }
  }, [refreshFn, t]);

  return { refreshing, onRefresh };
}
