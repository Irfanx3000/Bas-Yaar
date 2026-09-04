import { useState, useCallback, useEffect, useRef } from 'react';
import { tokenStorage } from '../api/tokenStorage';
import { registerResource } from '../store/dataSync';

// ─── useSyncedResource: the one way this app holds server state ──────────────
//
// Every shared context had independently reinvented the same four things —
// an `inFlight` ref, an auth check, a try/catch that swallowed the error, and
// a mount effect — and each got a slightly different subset right. None of
// them tracked WHEN the data was fetched, so nothing could tell fresh data
// from data that failed to load an hour ago, and none of them could be
// refreshed from outside their own consumers.
//
// This centralizes that shape and adds the two things that were missing:
// the fetch is timestamped (so staleness is a real question with a real
// answer), and the resource registers itself with dataSync (so reconnecting,
// signing in, and pull-to-refresh can all reach it).
//
// Cache semantics are deliberate and worth stating, because the previous
// behaviour looked identical in the happy path and was wrong everywhere else:
//
//   • A failed refresh KEEPS the last good data. Showing a job list you can
//     still read beats blanking the screen because one poll timed out.
//   • …but it records the failure, so `isStale()` reports true and the next
//     sweep retries. The old code kept the data and forgot the failure, which
//     is exactly how an empty applied-jobs Set became permanent.
//   • Signing out CLEARS the data. Stale is fine; another user's data is not.

const STALE_TIME_MS = 60000;

/**
 * @param {string} key                  dataSync identity, e.g. 'appliedJobs'
 * @param {() => Promise<any>} fetcher  the actual request
 * @param {object} [options]
 * @param {any}     [options.initialData]  value before first load / after logout
 * @param {boolean} [options.requiresAuth]  skip (and clear) when signed out
 * @param {number}  [options.staleTime]     age after which a background sweep refetches
 */
export function useSyncedResource(key, fetcher, options = {}) {
  const {
    initialData = null,
    requiresAuth = true,
    staleTime = STALE_TIME_MS,
  } = options;

  const [data, setData] = useState(initialData);
  // idle → nothing attempted yet | loading | success | error | unauthenticated.
  // `unauthenticated` is a distinct state rather than an error because consumers
  // must be able to tell "no session, nothing to show, stop the spinner" apart
  // from "the request failed, offer a retry" — SubscriptionContext renders a
  // skeleton on the former and would otherwise show it forever on the Auth stack.
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  // True during ANY fetch including a silent background one, whereas
  // status === 'loading' means "and we have nothing to show meanwhile".
  const [isFetching, setIsFetching] = useState(false);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(null);
  const lastFetchedAtRef = useRef(0);
  const lastFailedRef = useRef(false);

  // Held in refs so `refresh` can stay referentially stable for the lifetime of
  // the provider. Consumers put it in dependency arrays and useFocusEffect
  // callbacks; an identity that changes on every render turns those into
  // infinite loops (this app has already been bitten by exactly that — see
  // CareerProfileContext's `reload` comment).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const initialDataRef = useRef(initialData);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    // Join the in-flight request rather than starting a second one. Several
    // triggers legitimately fire at once (mount + reconnect + focus), and
    // without this each would cost its own round trip against a rate limiter
    // shared by the whole app.
    if (inFlightRef.current) return inFlightRef.current;

    const run = (async () => {
      if (requiresAuth) {
        const token = await tokenStorage.getAccessToken();
        if (!token) {
          if (mountedRef.current) {
            setData(initialDataRef.current);
            setStatus('unauthenticated');
            setError(null);
          }
          lastFetchedAtRef.current = 0;
          lastFailedRef.current = false;
          return undefined;
        }
      }

      if (mountedRef.current) {
        setIsFetching(true);
        // Only show a loading state when there is nothing to show underneath.
        // Flipping to 'loading' on a background revalidation would blank
        // screens that gate their render on it every time the app reconnects.
        setStatus((prev) => (prev === 'success' ? prev : 'loading'));
      }

      try {
        const result = await fetcherRef.current();
        lastFetchedAtRef.current = Date.now();
        lastFailedRef.current = false;
        if (mountedRef.current) {
          setData(result);
          setError(null);
          setStatus('success');
        }
        return result;
      } catch (err) {
        // Remembered, not just swallowed — this flag is what makes the next
        // reconnect/foreground sweep pick the resource back up instead of
        // leaving a cold-start failure in place until the process is killed.
        lastFailedRef.current = true;
        if (mountedRef.current) {
          setError(err);
          // Keep prior data on screen; only surface 'error' when there is
          // nothing cached to fall back to.
          setStatus((prev) => (prev === 'success' ? prev : 'error'));
        }
        return undefined;
      } finally {
        if (mountedRef.current) setIsFetching(false);
      }
    })();

    inFlightRef.current = run.finally(() => {
      inFlightRef.current = null;
    });
    return inFlightRef.current;
  }, [requiresAuth]);

  const isStale = useCallback(
    () => lastFailedRef.current || Date.now() - lastFetchedAtRef.current > staleTime,
    [staleTime],
  );

  /** Cheap enough to call on every screen focus — a no-op while fresh. */
  const refreshIfStale = useCallback(() => {
    if (!isStale()) return Promise.resolve();
    return refresh();
  }, [isStale, refresh]);

  const reset = useCallback(() => {
    lastFetchedAtRef.current = 0;
    lastFailedRef.current = false;
    if (!mountedRef.current) return;
    setData(initialDataRef.current);
    setStatus('unauthenticated');
    setError(null);
  }, []);

  // Register with the sync layer, then load. Registration comes first so a
  // sweep triggered while this very first fetch is in flight coalesces into it
  // rather than racing it.
  useEffect(() => {
    const unregister = registerResource(key, { refresh, reset, isStale });
    refresh();
    return unregister;
  }, [key, refresh, reset, isStale]);

  return {
    data,
    setData,
    status,
    error,
    isFetching,
    // Convenience for the common "spinner while we have nothing" check.
    isLoading: status === 'loading',
    isAuthenticated: status !== 'unauthenticated',
    lastFetchedAt: lastFetchedAtRef.current,
    refresh,
    refreshIfStale,
    isStale,
    reset,
  };
}
