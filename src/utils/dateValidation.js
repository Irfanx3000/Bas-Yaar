// Shared by any screen using AppFormField's `type="date"` (DD-MM-YYYY) —
// personal info's DOB, certificate issue/expiry dates, etc.

// Parses a strict DD-MM-YYYY string into a real calendar Date, or null if it
// isn't one (wrong format, or a day/month that doesn't exist — e.g.
// 31-02-2024). JS's Date constructor silently rolls invalid dates over into
// the next month instead of rejecting them, so the result is round-tripped
// back through its own fields to catch that.
export const parseDDMMYYYY = (value) => {
  if (!value || !/^\d{2}-\d{2}-\d{4}$/.test(value)) return null;
  const [dd, mm, yyyy] = value.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null;
  }
  return date;
};

// Whole-years age as of today.
export const calculateAge = (date) => {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};
