import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { notificationService } from '../services/notification.service';
import { tokenStorage } from '../api/tokenStorage';
import { notificationRefreshRef } from './notificationRefreshRef';

// Kept modest (not a few seconds) since this shares a per-IP rate-limit budget
// with every other screen in the app (see config.rateLimit.general) — mirrors
// useSubscription.js's polling interval/rationale for the same reason.
const POLL_INTERVAL_MS = 20000;

// Single source of truth for the unread notification count, shared across the
// app (bell icon badge, Notifications screen) so both stay in sync.
const NotificationContext = createContext({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  setUnreadCount: () => {},
});

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const inFlight = useRef(false);
  // A call that arrives while one is already in flight used to be silently
  // dropped (no re-run, no queue) — e.g. a push notification landing during
  // the mount-time fetch or the 20s poll would bump the OS tray but never
  // touch the bell badge, since the refresh it triggered was just discarded.
  // This flag makes such a call coalesce into one extra run right after the
  // in-flight one finishes, instead of being lost.
  const rerunPending = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (inFlight.current) {
      rerunPending.current = true;
      return;
    }
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      setUnreadCount(0);
      return;
    }
    inFlight.current = true;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // keep whatever we already have on transient failures
    } finally {
      inFlight.current = false;
      if (rerunPending.current) {
        rerunPending.current = false;
        refreshUnreadCount();
      }
    }
  }, []);

  // Make refreshUnreadCount reachable from outside the component tree (e.g.
  // push.service.js's foreground message handler, which isn't a React
  // component) so an incoming push can bump the badge the instant it arrives.
  useEffect(() => {
    notificationRefreshRef.current = refreshUnreadCount;
    return () => {
      if (notificationRefreshRef.current === refreshUnreadCount) notificationRefreshRef.current = null;
    };
  }, [refreshUnreadCount]);

  // Refresh on mount, whenever the app comes back to the foreground, and via
  // a modest background poll while foregrounded — the badge previously only
  // updated when the Notifications screen itself was opened, so new
  // notifications created elsewhere (e.g. an admin status change) sat unseen
  // until the user happened to check that screen.
  useEffect(() => {
    refreshUnreadCount();

    let interval = null;
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    startPolling();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
