import axios from 'axios';
import { APP_CONFIG } from '../constants/app.constants';
import { tokenStorage } from './tokenStorage';
import { ENDPOINTS } from './endpoints';
import { navigationRef } from '../navigation/navigationRef';
import { showAlert } from '../utils/alertRef';
import { openContactSupport } from '../utils/supportModalRef';
import i18n from '../i18n';
import { connectivity } from '../utils/connectivity';
import { dataSync } from '../store/dataSync';

const apiClient = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: APP_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Which failures are "session" failures ─────────────────────────────────────
// Everything below hinges on one distinction that this file previously did not
// make: a 401 can mean two completely different things.
//
//   (a) "your session expired"    → refresh the token, or sign the user out
//   (b) "those credentials are wrong" → show an error, change nothing else
//
// Treating (b) as (a) is what caused the login flicker/crash. A wrong password
// returns 401 from POST /auth/login, which used to fall into the refresh branch
// below, fail (a logged-out user has no refresh token), and run the full
// sign-out path — clear storage + navigationRef.reset() to Auth — on a user who
// had no session at all. Worse, that sign-out path itself calls
// deregisterCurrentDevice(), an *authenticated* DELETE /notifications/device-token;
// with no token it 401s straight back into this same interceptor, which starts
// the whole thing over. The recursion only stopped when the server's general
// rate limiter (600 req/15 min) answered 429 instead of 401 — and then every
// unwound frame ran its own clearAll() + navigationRef.reset(), remounting the
// navigator hundreds of times in a row. That burst is the flicker, and it is
// also the most likely cause of the process being killed.
//
// Two independent guards now prevent that class of failure:
//   1. AUTH_ENTRY_PATHS  — endpoints that *establish* a session can never
//                          trigger session recovery.
//   2. _sentWithToken    — a request that carried no token had no session to
//                          recover, so there is nothing to refresh or tear down.
// Plus _skipSessionRecovery, which the teardown's own cleanup call sets so it
// can never re-enter this interceptor no matter what else changes.

const AUTH_ENTRY_PATHS = [
  ENDPOINTS.AUTH.LOGIN,
  ENDPOINTS.AUTH.REGISTER,
  ENDPOINTS.AUTH.REFRESH,
  ENDPOINTS.AUTH.SEND_OTP,
  ENDPOINTS.AUTH.VERIFY_MOBILE,
  ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.RESET_PASSWORD,
  ENDPOINTS.AUTH.RESEND_VERIFICATION,
  ENDPOINTS.AUTH.GOOGLE,
];

const isAuthEntryPoint = (config) => {
  const url = config?.url || '';
  return AUTH_ENTRY_PATHS.some((path) => url === path || url.endsWith(path));
};

// ── Request: inject Bearer token ──────────────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Recorded so the response interceptor can tell an authenticated request
  // apart from an anonymous one. Only the former can meaningfully expire.
  config._sentWithToken = !!token;
  return config;
});

// ── Response: token refresh + error normalization ─────────────────────────────

// The refresh call is made with BARE axios, not `apiClient`, so it does not
// inherit that instance's timeout — it has to carry its own or it can hang
// forever. That is not theoretical: a stalled refresh leaves `isRefreshing`
// true for the lifetime of the process, every subsequent 401 queues behind it
// and never settles, and any screen awaiting those requests (Home's
// Promise.allSettled over featured jobs / applications / career profile) never
// resolves — so its loading flag never clears and its sections render blank.
// Because the flags below are module-level, nothing short of restarting the app
// recovers. Hence a hard ceiling on both the request and the queue.
const REFRESH_TIMEOUT_MS = 15000;
// Slightly longer than the request itself, so this only ever fires if the
// refresh finished without notifying its subscribers — a bug, not a slow
// network. Failing the queued request is always better than hanging it.
const REFRESH_QUEUE_TIMEOUT_MS = 20000;

let isRefreshing = false;

// Requests that 401 WHILE a refresh triggered by some other request is
// already in flight used to fall straight through to rejection instead of
// waiting for it — only the very first concurrent 401 got the retry-with-
// fresh-token treatment via the `!isRefreshing` guard below. Screens that
// fire several requests at once on mount (e.g. Home's featured jobs +
// applications + career profile + profile + subscription, all via
// Promise.allSettled) would intermittently have every request EXCEPT the
// first one silently fail whenever the token happened to be expired at that
// moment — explaining reports of sections "randomly" coming back empty that
// fixed themselves on the next manual refresh (by which point the token was
// already fresh again). This queue makes every concurrent 401 wait for the
// one shared refresh and then retry with its result, instead of failing.
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const resolveSubscribers = (token, err) => {
  refreshSubscribers.forEach((callback) => callback(token, err));
  refreshSubscribers = [];
};

// Latched for the lifetime of the dead session, NOT just for the duration of
// the teardown. Several requests failing together (a screen that fetches five
// things on mount) would otherwise each clear storage and reset the navigator
// — one full navigator remount per in-flight request. Released only when a new
// session is actually established; see markSessionEstablished().
let sessionEnded = false;
let accountStatusHandled = false;

/**
 * Called by auth.service after tokens for a NEW session have been persisted
 * (login, Google login, OTP verification). Re-arms the one-shot guards above
 * so a genuinely new session can later be torn down normally.
 */
export const markSessionEstablished = () => {
  sessionEnded = false;
  accountStatusHandled = false;
  // Every shared context mounted BEFORE this point — the providers wrap the
  // Auth stack, so they all ran their first fetch with no token and got
  // nothing. Without this sweep, a user who signs in and goes straight to Home
  // sees no avatar and "Apply Now" on jobs they have already applied to, until
  // they happen to open the one screen that owns each fetch. Fire-and-forget:
  // login must not wait on it.
  dataSync.notifySessionEstablished();
};

const goToAuthRoot = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.reset({ index: 0, routes: [{ name: 'Auth' }] });
};

/**
 * The single, idempotent "this session is over" path: drop the device's push
 * registration, clear stored tokens, and return to the auth flow — exactly
 * once, no matter how many requests fail at the same time.
 */
const endSession = async () => {
  if (sessionEnded) return;
  sessionEnded = true;
  // Deregister BEFORE clearing tokens — needs the still-valid access token to
  // authenticate the request. Lazy require (not a top-level import) to avoid a
  // circular dependency: push.service.js -> notification.service.js -> this
  // file. Without this, this device's push token would stay attached to a
  // now-dead account, and the next login on this same device would silently
  // inherit its notifications until it re-registers a token (see
  // notification.service.js#registerDeviceToken on the backend, which now
  // reclaims a token from every other user on every fresh registration — this
  // call just avoids leaving it dangling in the meantime).
  const { deregisterCurrentDevice } = require('../services/push.service');
  await deregisterCurrentDevice().catch(() => {});
  await tokenStorage.clearAll();
  // Empty every cached resource before the navigator swaps to Auth. Stale data
  // is acceptable; the previous user's applications and avatar flashing behind
  // a login screen is not.
  dataSync.notifySessionEnded();
  goToAuthRoot();
};

// Resolved at call time, not module load: i18n is not guaranteed to have
// finished initialising when this module is first imported, and the user can
// change language mid-session.
const accountStatusCopy = (code) =>
  ({
    ACCOUNT_BLOCKED: { title: i18n.t('errors.accountBlockedTitle'), body: i18n.t('errors.accountBlockedBody') },
    ACCOUNT_DELETED: { title: i18n.t('errors.accountDeletedTitle'), body: i18n.t('errors.accountDeletedBody') },
  }[code]);

/**
 * Fires when an account is blocked/deleted — either mid-session (an admin
 * changed it under a live session) or at the login attempt itself
 * (auth.service.js#login/googleAuth throw the same codes as
 * auth.middleware.js, so this one handler covers both entry points).
 *
 * `hadSession` is what keeps those two cases apart. Mid-session, we sign the
 * user out and redirect. At login there is no session: no tokens to clear, no
 * push registration belonging to this device, and the user is already sitting
 * on the Auth stack — resetting the navigator under them would remount the
 * login screen mid-submit (visible flicker) for no benefit at all.
 */
const handleAccountDeactivated = async (code, fallbackMessage, details, hadSession) => {
  if (hadSession) {
    if (accountStatusHandled) return;
    accountStatusHandled = true;
    await endSession();
  }
  const copy = accountStatusCopy(code);
  const reason = details?.blockedReason;
  const message =
    code === 'ACCOUNT_BLOCKED' && reason
      ? i18n.t('errors.accountBlockedBodyWithReason', { reason })
      : (copy?.body ?? fallbackMessage ?? '');
  showAlert({
    type: 'error',
    title: copy?.title ?? 'Account Unavailable',
    message,
    buttons: [
      { text: i18n.t('common.ok'), style: 'cancel' },
      { text: i18n.t('common.contactSupport'), onPress: () => openContactSupport() },
    ],
  });
};

apiClient.interceptors.response.use(
  (response) => {
    // Cheapest possible liveness signal: a response arrived, so we are
    // reachable. This is what lets the app notice recovery through ordinary
    // traffic, without waiting for the next health probe to come round.
    connectivity.reportSuccess();
    return response;
  },
  async (error) => {
    const original = error.config;
    const resData = error.response?.data;
    let surfaced = false;

    // Feed the failure to the connectivity tracker BEFORE any of the recovery
    // logic below. It only treats a no-response failure as a *suspicion* and
    // confirms with its own probe, so a single slow request cannot flip the
    // whole app offline; anything with a status resolves the other way and
    // confirms we are online.
    connectivity.reportFailure(error);

    if (error.response?.status === 403 && ['ACCOUNT_BLOCKED', 'ACCOUNT_DELETED'].includes(resData?.code)) {
      handleAccountDeactivated(resData.code, resData?.message, resData?.details, !!original?._sentWithToken);
      surfaced = true;
    }

    // Try to refresh once on 401 — but ONLY for a request that actually
    // belonged to a session. See the long note at the top of this file for why
    // each clause is here; removing any one of them reopens the login-flicker
    // recursion.
    const canRecoverSession =
      !!original &&
      !original._retry &&
      !original._skipSessionRecovery &&
      original._sentWithToken === true &&
      !isAuthEntryPoint(original);

    if (error.response?.status === 401 && canRecoverSession) {
      original._retry = true;

      // A refresh is already in flight for some other concurrent request —
      // wait for it instead of racing another /auth/refresh call (which
      // would burn the already-in-progress refresh token and fail).
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          let settled = false;
          // Watchdog: a queued request must never be able to wait forever. If
          // the in-flight refresh somehow finishes without calling back, this
          // rejects instead of leaving the caller's await pending for good.
          const watchdog = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(error);
          }, REFRESH_QUEUE_TIMEOUT_MS);

          subscribeTokenRefresh((token, refreshErr) => {
            if (settled) return;
            settled = true;
            clearTimeout(watchdog);
            if (!token) {
              reject(refreshErr || error);
              return;
            }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      isRefreshing = true;
      // Captured rather than acted on inside the try, so the `finally` below
      // can guarantee the two invariants that matter no matter which path is
      // taken or what throws: the flag is cleared, and every queued request is
      // told the outcome. A subscriber left undrained is a request that never
      // settles — the exact failure that made Home's sections hang blank.
      let refreshedToken = null;
      let refreshError = null;
      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${APP_CONFIG.API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
          { refreshToken },
          // Bare axios does NOT inherit apiClient's timeout — without this the
          // call can stall indefinitely and deadlock every queued request
          // behind it. See the note on REFRESH_TIMEOUT_MS above.
          { timeout: REFRESH_TIMEOUT_MS }
        );
        // Refresh tokens rotate on every use (the server revokes the old one
        // and issues a new one) — this MUST be persisted, or the next silent
        // refresh sends an already-revoked token, which the server treats as
        // theft and wipes every session for the user (forcing a full re-login).
        // Validated rather than destructured blind: a malformed body would
        // otherwise store `undefined` as the access token and put the app into
        // a permanent 401 loop instead of failing over to a clean sign-out.
        const newToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken;
        if (!newToken) throw new Error('Malformed refresh response');
        await tokenStorage.setAccessToken(newToken);
        if (newRefreshToken) await tokenStorage.setRefreshToken(newRefreshToken);

        refreshedToken = newToken;
      } catch (refreshErr) {
        refreshError = refreshErr;
      } finally {
        isRefreshing = false;
        resolveSubscribers(refreshedToken, refreshError);
      }

      if (refreshedToken) {
        original.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient(original);
      }

      // Refresh failed — the session is dead. Sign out and send the user back
      // to the auth flow instead of leaving them stranded with dead tokens.
      await endSession();
    }

    // Normalize every error to a plain Error with a readable message.
    // Prefer the specific field-level validation detail (e.g. "Password must
    // include…") over the generic "Validation failed." so the user knows exactly
    // what to fix.
    const detailMsg = Array.isArray(resData?.details) && resData.details.length > 0
      ? resData.details[0]?.message
      : null;
    const message =
      detailMsg || resData?.message || error.message || 'Something went wrong';
    const normalized = new Error(message);
    normalized.status = error.response?.status;
    normalized.data = resData;
    // For network-level failures (no response at all — timeout, dropped
    // connection) there's no server `code` to key off of; preserve axios's
    // own error.code (e.g. 'ECONNABORTED', 'ERR_NETWORK') so callers can at
    // least distinguish "we never heard back" from a real server rejection.
    normalized.code = resData?.code || error.code;
    // Set when this interceptor already showed the user an alert for this
    // failure, so the calling screen doesn't queue a second, redundant one
    // on top of it.
    normalized.handled = surfaced;
    return Promise.reject(normalized);
  }
);

export default apiClient;
