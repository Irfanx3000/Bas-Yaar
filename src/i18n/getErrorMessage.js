import i18n from './index';
import { formatDuration } from '../utils/formatDuration';

/**
 * Picks the most specific translation key available for an error, and supplies
 * whatever the server sent alongside it as interpolation values.
 *
 * Some failures are only actionable if the user is told *how long* or *how many
 * tries are left* — a locked account previously rendered as a bare "please try
 * again later", which is the same message whether the wait is one minute or
 * thirty. The backend now returns that in `details`; this picks the variant
 * that matches what actually arrived, and always keeps a no-numbers fallback
 * for the case where it didn't.
 */
const VARIANTS = {
  // Wrong password, account not locked yet — warn as the limit approaches.
  INVALID_CREDENTIALS: (d) => {
    if (typeof d?.attemptsRemaining !== 'number' || d.attemptsRemaining <= 0) return null;
    return {
      key: d.attemptsRemaining === 1
        ? 'errors.INVALID_CREDENTIALS_attemptsOne'
        : 'errors.INVALID_CREDENTIALS_attemptsMany',
      params: { attempts: d.attemptsRemaining, minutes: d.lockDurationMinutes },
    };
  },
  // Account locked after too many failed attempts (HTTP 423).
  ACCOUNT_LOCKED: (d, t) => {
    if (!d?.retryAfterSeconds) return null;
    return { key: 'errors.ACCOUNT_LOCKED_wait', params: { wait: formatDuration(d.retryAfterSeconds, t) } };
  },
  // Per-IP throttle (HTTP 429).
  RATE_LIMIT_EXCEEDED: (d, t) => {
    if (!d?.retryAfterSeconds) return null;
    return { key: 'errors.RATE_LIMIT_EXCEEDED_wait', params: { wait: formatDuration(d.retryAfterSeconds, t) } };
  },
};

/**
 * Turn an API/client error into a user-facing, localized message.
 * Prefers a translation for the server's machine-readable `code`
 * (err.data.code from the axios normalizer, or err.code for client/native
 * errors); falls back to the raw message, then a generic string.
 *
 * @param {Error & { data?: { code?: string, details?: object }, code?: string }} err
 * @param {(key:string, opts?:object)=>string} [t] - optional t() from useTranslation
 */
export function getErrorMessage(err, t) {
  const translate = t || i18n.t.bind(i18n);
  const code = err?.data?.code || err?.code;
  const details = err?.data?.details;

  if (code) {
    // `details` is an array for field-level validation errors and an object
    // for these richer codes — only the object form carries retry info.
    const meta = !Array.isArray(details) ? details : null;
    const variant = VARIANTS[code]?.(meta, t);
    if (variant && i18n.exists(variant.key)) {
      return translate(variant.key, variant.params);
    }
    if (i18n.exists(`errors.${code}`)) {
      return translate(`errors.${code}`);
    }
  }

  return err?.message || translate('errors.generic');
}
