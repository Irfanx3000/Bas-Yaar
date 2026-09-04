import i18n from '../i18n';

// Map app language codes → BCP-47 locales for Intl/toLocale* APIs.
const LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  de: 'de-DE',
  fil: 'fil-PH',
  es: 'es-ES',
  ar: 'ar',
  zh: 'zh-CN',
};

const currentLocale = () => LOCALE_MAP[i18n.language] || 'en-IN';

/**
 * Format a date in the active language's locale.
 * @param {Date|string|number} date
 * @param {Intl.DateTimeFormatOptions} [opts]
 */
export const formatDate = (date, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  try {
    return d.toLocaleDateString(currentLocale(), opts);
  } catch {
    return d.toLocaleDateString('en-IN', opts);
  }
};

/**
 * Format a time (hour:minute) in the active language's locale.
 * @param {Date|string|number} date
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  try {
    return d.toLocaleTimeString(currentLocale(), { hour: 'numeric', minute: '2-digit' });
  } catch {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
};

/**
 * Format the day of week (e.g. "Monday") in the active language's locale.
 * @param {Date|string|number} date
 */
export const formatDayOfWeek = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  try {
    return d.toLocaleDateString(currentLocale(), { weekday: 'long' });
  } catch {
    return d.toLocaleDateString('en-IN', { weekday: 'long' });
  }
};

/**
 * Format a paise (integer) amount as localized currency.
 * @param {number} paise
 * @param {string} [currency='INR']
 */
export const formatCurrency = (paise, currency = 'INR') => {
  const amount = Number(paise || 0) / 100;
  try {
    return new Intl.NumberFormat(currentLocale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};
