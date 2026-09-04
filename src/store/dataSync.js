import { AppState } from 'react-native';
import { connectivity } from '../utils/connectivity';

// ─── dataSync: one registry of every piece of server state the app caches ────
//
// The bug this fixes is not "one screen forgot to refresh". It is that there
// was no such thing as "the app's server state" — there were eight independent
// caches (ProfileContext, AppliedJobsContext, SavedJobsContext,
// SubscriptionContext, plus each screen's own local state), each fetched once
// on mount, each swallowing its own errors, and none of them reachable from
// anywhere else. So there was no place to stand to say "we are back online,
// everything you know is suspect, go ask again". Pull-to-refresh on Home could
// only ever refresh the three things Home itself fetched, which is precisely
// why manually refreshing never fixed a job card that still said "Apply Now".
//
// Every cache registers here. Then the four moments when cached server state
// becomes untrustworthy each have exactly one handler:
//
//   reconnected          — we were offline, we are not any more. Everything
//                          fetched (or failed) during the outage is suspect.
//   session-established  — a different user may now be signed in. Nothing
//                          cached under the previous session may survive.
//   session-ended        — sign-out. Every cache must be emptied, not merely
//                          refetched, or the next user briefly sees the last
//                          user's applications behind the login screen.
//   foreground           — the app was away long enough that the world moved
//                          on (an admin changed a status, the user applied on
//                          the web). Stale entries only, not everything.
//
// Deliberately not a generic client like React Query: the app already has a
// working idiom (contexts exposing `refresh`), and the fix is to give those
// refreshes a coordinator, not to rewrite every consumer.

// A registered cache. `refresh` is wrapped in in-flight coalescing by
// register(), so a screen calling revalidate() while the same resource is
// already loading joins the existing request instead of firing a second one.
const resources = new Map();

// Coalesces overlapping app-wide sweeps into one. Reconnecting frequently
// coincides with a foreground transition and a pull-to-refresh in the same
// second; each would otherwise re-fetch every resource in the app.
let sweepInFlight = null;

let started = false;
let appStateSub = null;
let connectivitySub = null;
let lastBackgroundedAt = 0;

// How long the app has to have been away before returning to it re-fetches
// stale resources. Below this, the user is app-switching (checking a code in
// their SMS app, following a link) and their data is as fresh as when they
// left — refetching would cost a round trip per switch for nothing.
const FOREGROUND_STALE_AFTER_MS = 30000;

/**
 * Register a cache with the sync layer.
 *
 * @param {string} key           Stable identity, e.g. 'profile'. Re-registering
 *                               the same key replaces the old entry — the
 *                               provider remounting must not leave a dead
 *                               closure behind holding a stale setState.
 * @param {object} handlers
 * @param {() => Promise<any>} handlers.refresh   Force a fetch.
 * @param {() => void}        [handlers.reset]    Drop cached data (sign-out).
 * @param {() => boolean}     [handlers.isStale]  Worth refetching on foreground?
 * @returns {() => void} unregister
 */
export function registerResource(key, { refresh, reset, isStale } = {}) {
  if (typeof refresh !== 'function') {
    throw new Error(`registerResource(${key}): refresh must be a function`);
  }

  const entry = {
    key,
    reset,
    isStale,
    inFlight: null,
    // Coalescing lives here rather than in each caller so that every path into
    // a refresh — the provider's own mount effect, a screen's pull-to-refresh,
    // a reconnect sweep — shares one request. Without it, pulling to refresh
    // on Home the instant the network returns fires two identical fetches of
    // every resource in the app.
    run() {
      if (entry.inFlight) return entry.inFlight;
      entry.inFlight = Promise.resolve()
        .then(() => refresh())
        .finally(() => {
          entry.inFlight = null;
        });
      return entry.inFlight;
    },
  };

  resources.set(key, entry);
  return () => {
    // Only remove if it is still ours. A remount registers the replacement
    // before the old effect's cleanup runs, and deleting blindly there would
    // unregister the live one.
    if (resources.get(key) === entry) resources.delete(key);
  };
}

/** Refresh specific resources by key. Unknown keys are ignored. */
export function revalidate(keys, _reason = 'manual') {
  const list = Array.isArray(keys) ? keys : [keys];
  return Promise.all(
    list
      .map((key) => resources.get(key))
      .filter(Boolean)
      // allSettled semantics: one dead endpoint must not abort the others, and
      // the returned promise must always resolve — a pull-to-refresh spinner
      // hangs forever on a rejection.
      .map((entry) => entry.run().catch(() => {})),
  );
}

/**
 * Refresh everything. This is the app's "re-establish the source of truth"
 * button: what a reconnect, a login, and a pull-to-refresh all call.
 */
export function revalidateAll(_reason = 'manual') {
  if (sweepInFlight) return sweepInFlight;
  sweepInFlight = Promise.all(
    Array.from(resources.values()).map((entry) => entry.run().catch(() => {})),
  ).finally(() => {
    sweepInFlight = null;
  });
  return sweepInFlight;
}

/** Refresh only what has aged past its own staleTime, or last failed. */
export function revalidateStale(reason = 'stale') {
  const keys = Array.from(resources.values())
    .filter((entry) => (entry.isStale ? entry.isStale() : true))
    .map((entry) => entry.key);
  if (keys.length === 0) return Promise.resolve([]);
  return revalidate(keys, reason);
}

/**
 * Sign-out. Empties every cache synchronously rather than refetching, so no
 * request carrying a just-cleared token is left in flight and no fragment of
 * the previous user's data can render under the auth stack.
 */
export function resetAll() {
  resources.forEach((entry) => {
    try {
      entry.reset?.();
    } catch {
      // One cache failing to clear must not leave the rest populated.
    }
  });
}

/**
 * Called from api/client.js#markSessionEstablished, i.e. after login /
 * Google login / OTP verification has persisted tokens.
 *
 * This closes a bug that had nothing to do with the network: the providers
 * wrap the Auth stack too, so they all mount and run their first fetch BEFORE
 * anyone is signed in. That fetch finds no token, returns empty, and nothing
 * ever re-ran it — so a user who signed in and went straight to Home saw
 * "Apply Now" on jobs they had already applied to, and no avatar, until they
 * happened to open the screen that owned each fetch.
 */
export function notifySessionEstablished() {
  return revalidateAll('session-established');
}

export function notifySessionEnded() {
  resetAll();
}

/**
 * Wire the automatic triggers. Idempotent; call once from App.
 */
export function startAutoSync() {
  if (started) return;
  started = true;

  connectivity.start();

  connectivitySub = connectivity.subscribe((online) => {
    // Only the offline→online edge is interesting. connectivity only emits on
    // a real transition, so this cannot fire repeatedly while connected.
    if (online) revalidateAll('reconnected');
  });

  appStateSub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      lastBackgroundedAt = Date.now();
      return;
    }
    const away = lastBackgroundedAt ? Date.now() - lastBackgroundedAt : Infinity;
    lastBackgroundedAt = 0;
    if (away < FOREGROUND_STALE_AFTER_MS) return;
    // Stale-only, not everything: coming back after a minute should update
    // what has plausibly changed, not re-download the whole app state. If the
    // connection died while away, connectivity's own foreground probe will
    // detect it and the reconnect sweep above takes over.
    revalidateStale('foreground');
  });
}

export function stopAutoSync() {
  started = false;
  connectivitySub?.();
  connectivitySub = null;
  appStateSub?.remove();
  appStateSub = null;
}

export const dataSync = {
  registerResource,
  revalidate,
  revalidateAll,
  revalidateStale,
  resetAll,
  notifySessionEstablished,
  notifySessionEnded,
  startAutoSync,
  stopAutoSync,
};
