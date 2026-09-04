// IMPORTANT: import the country + state submodules DIRECTLY, not from the package
// index ('country-state-city'). The index eagerly `require`s city.js, which pulls
// a 7.7MB city.json — parsing that blocks the JS thread and, once parsed, the
// resulting object graph is meaningfully larger in memory than the raw JSON. On
// low-end devices that was enough to trigger an OS-level out-of-memory kill —
// which presents as the whole app closing, not a catchable JS error — the first
// time someone opened the City picker on the Location screen (step 2 of account
// creation). Lazily loading it client-side only delayed when that risk was paid,
// it didn't remove it, since opening the City picker is exactly the moment the
// parse has to run. City lookup now lives on the backend instead (see
// geo.service.js) — this file only ever touches the small country/state data.
//
// country.json (94KB) and state.json (542KB) are small and safe to evaluate at
// module load.
import Country from 'country-state-city/lib/cjs/country';
import State from 'country-state-city/lib/cjs/state';

// Pre-computed once at module load — cheap (country.json only). Used for the
// Nationality and Country dropdowns. No per-mount useMemo needed.
export const COUNTRY_OPTIONS = Country.getAllCountries().map((c) => ({
  value: c.isoCode,       // 'IN'
  label: c.name,          // 'India'
  flag: c.flag,           // '🇮🇳'
  dialCode: c.phonecode,  // '91'
}));

// States/provinces for a given country ISO code — computed on demand (small lists)
export const getStateOptions = (countryCode) =>
  State.getStatesOfCountry(countryCode).map((s) => ({
    value: s.isoCode,  // 'MH'
    label: s.name,     // 'Maharashtra'
  }));

// Dial codes sorted longest-first so e.g. '91' (India) matches before a
// shorter prefix of the same digits could accidentally win.
const DIAL_CODES_LONGEST_FIRST = [...COUNTRY_OPTIONS].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

// Splits a stored "+<dialCode><localNumber>" string (the format registration
// saves, see StayConnectedScreen) back into its country and local-number
// parts, so the edit-profile phone field can lock the dial code and only let
// the local digits be edited. Returns null if the string doesn't start with
// '+' or matches no known dial code.
export const splitPhone = (fullPhone) => {
  if (!fullPhone || !fullPhone.startsWith('+')) return null;
  const digits = fullPhone.slice(1);
  const match = DIAL_CODES_LONGEST_FIRST.find((c) => digits.startsWith(c.dialCode));
  if (!match) return null;
  return {
    dialCode: match.dialCode,
    flag: match.flag,
    isoCode: match.value,
    localNumber: digits.slice(match.dialCode.length),
  };
};
