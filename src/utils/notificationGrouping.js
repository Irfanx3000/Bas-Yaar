import { formatDate, formatTime, formatDayOfWeek } from './format';

const isSameCalendarDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Groups notifications into Today / Yesterday / Earlier buckets using
 * calendar-day comparison (not a rolling 24h window), so "Today" always
 * means the device's current calendar date. Assumes `notifications` is
 * already sorted newest-first (the API returns it that way).
 */
export function groupNotifications(notifications) {
  const today = [];
  const yesterday = [];
  const earlier = [];
  const now = new Date();
  const yesterdayDate = addDays(now, -1);

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (isSameCalendarDay(d, now)) today.push(n);
    else if (isSameCalendarDay(d, yesterdayDate)) yesterday.push(n);
    else earlier.push(n);
  }

  return { today, yesterday, earlier };
}

/**
 * Returns { date, time, dayOfWeek } for a notification's createdAt timestamp,
 * localized to the app's active language.
 */
export function formatNotificationTimestamp(isoString) {
  return {
    date: formatDate(isoString),
    time: formatTime(isoString),
    dayOfWeek: formatDayOfWeek(isoString),
  };
}
