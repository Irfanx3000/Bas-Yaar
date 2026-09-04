import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { connectivity } from '../utils/connectivity';

// React binding over the connectivity singleton (src/utils/connectivity.js).
// The singleton is the source of truth and works with no React at all — the
// API client and dataSync both talk to it directly — so this is only here to
// let components re-render on a transition.
const ConnectivityContext = createContext({
  isOnline: true,
  // True for a few seconds immediately after recovery, so the UI can confirm
  // rather than just silently removing the offline bar. Users who have been
  // staring at "no connection" need to be told the refetch is happening;
  // otherwise the same screen full of stale data reads as "still broken".
  justReconnected: false,
  retry: () => {},
});

const RECONNECT_NOTICE_MS = 2500;

export function ConnectivityProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => connectivity.isOnline());
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOfflineRef = useRef(!connectivity.isOnline());
  const noticeTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = connectivity.subscribe((online) => {
      setIsOnline(online);
      if (!online) {
        wasOfflineRef.current = true;
        clearTimeout(noticeTimer.current);
        setJustReconnected(false);
        return;
      }
      // Only celebrate a real recovery. The optimistic initial state means the
      // very first "online" is not a transition anyone should be told about.
      if (!wasOfflineRef.current) return;
      wasOfflineRef.current = false;
      setJustReconnected(true);
      clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setJustReconnected(false), RECONNECT_NOTICE_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(noticeTimer.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      justReconnected,
      // Manual "try again". Skips the backoff wait — someone who has just
      // walked back to their WiFi should not sit through the remaining 30s of
      // a sleep before the app notices.
      retry: () => connectivity.probeNow(),
    }),
    [isOnline, justReconnected],
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export const useConnectivity = () => useContext(ConnectivityContext);
