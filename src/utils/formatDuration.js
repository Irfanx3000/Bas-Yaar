import i18n from '../i18n';

/**
 * Turns a second count into a short, localized "how long you have to wait"
 * string — "30 minutes", "4 minutes 20 seconds", "45 seconds".
 *
 * Built by composing number + unit rather than going through i18next's plural
 * machinery on purpose: the app ships seven languages including Arabic (six
 * plural forms) and Chinese (none), and i18n is initialised with
 * compatibilityJSON: 'v3' to dodge Hermes' Intl.PluralRules gaps. Two explicit
 * singular/plural unit keys per language are far less fragile here than seven
 * sets of plural suffixes, and number-then-unit ordering reads correctly in
 * every language the app supports.
 *
 * @param {number} totalSeconds
 * @param {(key:string)=>string} [t] - optional t() from useTranslation
 * @returns {string}
 */
/**
 * Picks the singular/dual/plural unit key for a count.
 *
 * Arabic does not split at "1 vs more": the plural is used only for 3–10, the
 * dual is its own form, and 11 and above takes the SINGULAR. Applying the
 * English rule produced "30 دقائق", which is wrong — it has to be "30 دقيقة".
 * Every other language the app ships (en, hi, de, fil, es, zh) is served
 * correctly by the one-vs-other split; fil and zh simply use the same word for
 * both forms.
 */
const unitKey = (n, singular, plural, dual, lang) => {
  if (String(lang || '').startsWith('ar')) {
    if (n === 2 && dual) return dual;
    if (n >= 3 && n <= 10) return plural;
    return singular; // 1, and everything from 11 up
  }
  return n === 1 ? singular : plural;
};

export function formatDuration(totalSeconds, t) {
  const translate = t || i18n.t.bind(i18n);
  const seconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  const lang = i18n.language;

  const isArabic = String(lang || '').startsWith('ar');
  const unit = (n, one, many) => {
    const word = translate(unitKey(n, one, many, `${one}Two`, lang));
    // The Arabic dual already carries "two" inside the word (ثانيتان =
    // "two seconds"), so prefixing the numeral would read as "2 two-seconds".
    if (isArabic && n === 2) return word;
    return `${n} ${word}`;
  };

  if (seconds < 60) {
    // Never render "0 seconds" — at that point the wait is over, and the user
    // should be told to try again, not shown an empty duration.
    return unit(Math.max(1, seconds), 'time.second', 'time.seconds');
  }

  const totalMinutes = Math.ceil(seconds / 60);

  if (totalMinutes < 60) {
    const wholeMinutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    // Below 10 minutes the seconds still matter to someone staring at a
    // countdown; above that they're noise, so round up to whole minutes.
    if (wholeMinutes < 10 && remainder > 0) {
      return `${unit(wholeMinutes, 'time.minute', 'time.minutes')} ${unit(remainder, 'time.second', 'time.seconds')}`;
    }
    return unit(totalMinutes, 'time.minute', 'time.minutes');
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return unit(hours, 'time.hour', 'time.hours');
  return `${unit(hours, 'time.hour', 'time.hours')} ${unit(minutes, 'time.minute', 'time.minutes')}`;
}
