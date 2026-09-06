/* "14:30" → "2:30 PM".
 *
 * The app defines this function twice — once in ConsultancyScreen.jsx and again,
 * identically, in ConsultancyBookingsScreen.jsx. Both web pages need it too, so
 * it lives in one place here rather than being copied a third and fourth time.
 *
 * Deliberately NOT via Date/Intl: the value is a wall-clock slot time from the
 * admin's schedule, with no date and no zone. Wrapping it in a Date would invent
 * both, and then shift the result for anyone whose offset disagrees — a 09:00
 * slot must read 9:00 AM everywhere.
 */
export function formatTime12h(hhmm) {
  if (!hhmm) return "";
  const [h, m] = String(hhmm).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
