import React, {
  createContext,
  useContext,
  useMemo,
} from 'react';
import { subscriptionService } from '../services/subscription.service';
import { useSyncedResource } from '../hooks/useSyncedResource';

// App-wide subscription status so the home alert, gating UI, and the subscription
// screen all read the same source. Refreshed after a successful purchase, and —
// now that it is registered with dataSync — on login, on reconnect, and on any
// pull-to-refresh, so a plan bought on another device or expiring server-side
// stops needing an app restart to show up.
const SubscriptionContext = createContext({
  subscription: null,
  isActive: false,
  tier: null,
  applicationsUsed: 0,
  applicationLimit: null,
  applicationsRemaining: null,
  loading: false,
  refresh: async () => {},
  refreshIfStale: async () => {},
});

export function SubscriptionProvider({ children }) {
  const {
    data: subscription,
    status,
    isFetching,
    refresh,
    refreshIfStale,
  } = useSyncedResource('subscription', subscriptionService.getStatus, {
    staleTime: 60000,
  });

  const value = useMemo(() => ({
    subscription,
    isActive: !!subscription?.active,
    tier: subscription?.active ? subscription.tier : null,
    applicationsUsed: subscription?.active ? subscription.applicationsUsed : 0,
    applicationLimit: subscription?.active ? subscription.applicationLimit : null,
    applicationsRemaining: subscription?.active ? subscription.applicationsRemaining : null,
    // 'idle' is the single render between mount and the first fetch starting.
    // Counting it as loading preserves the previous `useState(true)` behaviour
    // — consumers gate a skeleton on this flag and must not see one frame of
    // "no subscription" before the request has even begun. Crucially this does
    // NOT include 'unauthenticated', so the skeleton resolves on the Auth
    // stack instead of spinning forever.
    loading: isFetching || status === 'idle',
    refresh,
    refreshIfStale,
  }), [subscription, isFetching, status, refresh, refreshIfStale]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscriptionStatus = () => useContext(SubscriptionContext);
