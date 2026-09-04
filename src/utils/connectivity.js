import axios from 'axios';
import { AppState } from 'react-native';
import { APP_CONFIG } from '../constants/app.constants';

// ─── Connectivity: the app's single answer to "can we reach the backend?" ────
//
// Why this exists at all: nothing in the app used to know the network had come
// back. Every shared context fetched once on mount and silently kept whatever
// it had on failure, so a cold start with no signal left the applied-jobs Set
// empty, the avatar null, and the saved-jobs list blank — permanently, because
// those providers wrap NavigationContainer and therefore never unmount. Only
// killing the process fixed it. Something has to notice the transition from
// offline to online and say so; that is this module's entire job.
//
// It deliberately does NOT depend on @react-native-community/netinfo. Two
// reasons. Practically, adding a native module means a rebuild. More
// importantly, NetInfo answers a different question than the one that matters:
// it reports whether a transport is attached (WiFi associated, cellular up),
// not whether OUR server is reachable. Captive portals, a dead backend, a VPN
// that has dropped, an airplane-mode toggle that leaves a socket half-open —
// all read as "connected" to NetInfo while every request still fails.
// Reachability of the actual API is the only signal that predicts whether a
// refetch will succeed, so that is what we measure.
//
// The signal comes from two sources, which together cost nothing while
// everything is healthy:
//   1. Real traffic. Every response the API client sees reports in — a success
//      proves we are online; a network-level failure is a *suspicion*.
//   2. An explicit probe of GET /health, used to confirm a suspicion and then
//      to poll for recovery. Only ever runs while we believe we are offline.
//
// That split matters. A single request timing out does not flip the app to
// offline — one slow upload on an otherwise fine connection would light up the
// banner and trigger a pointless app-wide refetch. The failure only starts a
// probe; the probe's own failure is what declares us offline.

// /health is mounted at the server ROOT, not under /api/v1 — hence
// MEDIA_BASE_URL (the API base with the version suffix stripped) rather than
// API_BASE_URL. It needs no auth, touches no database, and returns a few bytes.
const PROBE_URL = `${APP_CONFIG.MEDIA_BASE_URL}/health`;

// Shorter than the API client's 15s. A probe is a liveness question, not a
// data fetch: if the server cannot answer a static JSON body in this long, a
// real request would not have fared better, and we would rather declare
// offline early and recover fast than sit on a stalled socket.
const PROBE_TIMEOUT_MS = 8000;

// Recovery polling while offline. Front-loaded so a brief blip (a lift, a
// tunnel, a cell handover) recovers in about two seconds, then backing off to
// one probe every 30s so a genuinely long outage — or a phone left face-down
// overnight — costs ~2 requests/minute rather than hammering both the device's
// radio and the backend's per-IP rate limiter (600 req/15 min, shared with
// every other request the app makes).
const BACKOFF_STEPS_MS = [2000, 4000, 8000, 15000, 30000];

// Axios error codes meaning "we never got an answer", as opposed to "the
// server answered and said no". Only the former says anything about
// connectivity: a 401/429/500 proves we ARE online.
const NETWORK_ERROR_CODES = new Set([
  'ERR_NETWORK',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

export const isNetworkError = (error) => {
  if (!error) return false;
  // A response of any status means the round trip completed. `status` is
  // checked too because api/client.js normalizes errors into plain Errors and
  // copies the status onto them, discarding `response`.
  if (error.response || typeof error.status === 'number') return false;
  return NETWORK_ERROR_CODES.has(error.code) || /network|timeout/i.test(error.message || '');
};

class Connectivity {
  constructor() {
    // Optimistic on purpose. Starting "offline" would flash the banner on
    // every cold start for the duration of the first request, and would tell
    // consumers to hold back fetches at exactly the moment the app needs to
    // make its first ones. Assume reachable until something proves otherwise.
    this.online = true;
    this.listeners = new Set();
    this.attempt = 0;
    this.timer = null;
    this.probeInFlight = null;
    this.appStateSub = null;
    this.started = false;
  }

  isOnline() {
    return this.online;
  }

  /**
   * Subscribe to transitions. Fires only on an actual change of state, never
   * on every probe, so a consumer can treat each call as an edge — "we just
   * came back" is what triggers app-wide revalidation and must not repeat.
   * Returns an unsubscribe function.
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _emit() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.online);
      } catch {
        // A throwing subscriber must not stop the others from being told, and
        // must never take down the probe loop that called it.
      }
    });
  }

  _setOnline(next) {
    if (this.online === next) return;
    this.online = next;
    if (next) this._stopPolling();
    else this._scheduleProbe();
    this._emit();
  }

  /** Any successful response is proof of reachability — our cheapest signal. */
  reportSuccess() {
    this.attempt = 0;
    this._setOnline(true);
  }

  /**
   * A request failed at the network level. Treated as a SUSPICION, not a
   * verdict: one timed-out request on a healthy connection (a big upload, a
   * cold backend route) must not flip the whole app to offline. We probe, and
   * only the probe failing declares us offline.
   */
  reportFailure(error) {
    if (!isNetworkError(error)) {
      // The server answered, so we are demonstrably online. This is also how
      // recovery gets noticed through ordinary traffic rather than a probe.
      this.reportSuccess();
      return;
    }
    if (!this.online) return; // already offline; the poll loop owns recovery
    this.probeNow();
  }

  /**
   * Ask the server directly whether it is reachable. Concurrent callers share
   * one in-flight probe — a failure storm (five parallel requests on a screen
   * mount all failing at once) must produce one probe, not five.
   */
  probeNow() {
    if (this.probeInFlight) return this.probeInFlight;
    this.probeInFlight = axios
      .get(PROBE_URL, {
        timeout: PROBE_TIMEOUT_MS,
        // Bypass any HTTP caching layer; a cached 200 would report a server
        // that has since gone away as reachable.
        headers: { 'Cache-Control': 'no-cache' },
      })
      .then(() => {
        this.attempt = 0;
        this._setOnline(true);
        return true;
      })
      .catch((err) => {
        // A rate-limit or a 5xx still proves the round trip works. Only a
        // genuine no-answer means offline.
        if (!isNetworkError(err)) {
          this._setOnline(true);
          return true;
        }
        this._setOnline(false);
        this._scheduleProbe();
        return false;
      })
      .finally(() => {
        this.probeInFlight = null;
      });
    return this.probeInFlight;
  }

  _scheduleProbe() {
    if (this.timer || this.online) return;
    const delay = BACKOFF_STEPS_MS[Math.min(this.attempt, BACKOFF_STEPS_MS.length - 1)];
    this.attempt += 1;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.online) this.probeNow();
    }, delay);
  }

  _stopPolling() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  /**
   * Idempotent. Backgrounding is when a stalled socket actually dies, and
   * returning is when the user is most likely to have walked back into
   * coverage or switched airplane mode off — so the foreground transition
   * resets the backoff and probes immediately instead of waiting out a 30s
   * sleep. That wait is the difference between the app being correct when the
   * user looks at it and being correct half a minute later.
   */
  start() {
    if (this.started) return;
    this.started = true;
    this.appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        // No point burning the radio on probes while backgrounded; the
        // foreground transition re-probes anyway.
        this._stopPolling();
        return;
      }
      if (!this.online) {
        this.attempt = 0;
        this._stopPolling();
        this.probeNow();
      }
    });
  }

  stop() {
    this.started = false;
    this._stopPolling();
    this.appStateSub?.remove();
    this.appStateSub = null;
  }
}

export const connectivity = new Connectivity();
