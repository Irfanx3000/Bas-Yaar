// National mobile-number length (digits after the country/dial code) for the
// countries most relevant to CrewApply's seafarer user base plus other major
// markets. Anything not listed falls back to a generic 6-15 range (the loose
// bound the whole app used before this table existed) rather than guessing.
const PHONE_LENGTH_BY_ISO = {
  IN: { min: 10, max: 10 }, // India
  PH: { min: 10, max: 10 }, // Philippines
  ID: { min: 9, max: 12 }, // Indonesia
  CN: { min: 11, max: 11 }, // China
  PK: { min: 10, max: 10 }, // Pakistan
  BD: { min: 10, max: 10 }, // Bangladesh
  LK: { min: 9, max: 9 }, // Sri Lanka
  NP: { min: 10, max: 10 }, // Nepal
  MM: { min: 8, max: 10 }, // Myanmar
  VN: { min: 9, max: 10 }, // Vietnam
  TH: { min: 9, max: 9 }, // Thailand
  MY: { min: 9, max: 10 }, // Malaysia
  SG: { min: 8, max: 8 }, // Singapore
  JP: { min: 10, max: 10 }, // Japan
  KR: { min: 9, max: 10 }, // South Korea
  RU: { min: 10, max: 10 }, // Russia
  UA: { min: 9, max: 9 }, // Ukraine
  US: { min: 10, max: 10 }, // United States
  CA: { min: 10, max: 10 }, // Canada
  GB: { min: 10, max: 10 }, // United Kingdom
  IE: { min: 9, max: 9 }, // Ireland
  DE: { min: 10, max: 11 }, // Germany
  FR: { min: 9, max: 9 }, // France
  IT: { min: 9, max: 10 }, // Italy
  ES: { min: 9, max: 9 }, // Spain
  PT: { min: 9, max: 9 }, // Portugal
  NL: { min: 9, max: 9 }, // Netherlands
  BE: { min: 9, max: 9 }, // Belgium
  PL: { min: 9, max: 9 }, // Poland
  GR: { min: 10, max: 10 }, // Greece
  TR: { min: 10, max: 10 }, // Turkey
  CH: { min: 9, max: 9 }, // Switzerland
  AT: { min: 10, max: 13 }, // Austria
  NO: { min: 8, max: 8 }, // Norway
  SE: { min: 9, max: 9 }, // Sweden
  DK: { min: 8, max: 8 }, // Denmark
  FI: { min: 9, max: 10 }, // Finland
  AU: { min: 9, max: 9 }, // Australia
  NZ: { min: 8, max: 9 }, // New Zealand
  AE: { min: 9, max: 9 }, // United Arab Emirates
  SA: { min: 9, max: 9 }, // Saudi Arabia
  QA: { min: 8, max: 8 }, // Qatar
  KW: { min: 8, max: 8 }, // Kuwait
  OM: { min: 8, max: 8 }, // Oman
  BH: { min: 8, max: 8 }, // Bahrain
  EG: { min: 10, max: 10 }, // Egypt
  NG: { min: 10, max: 10 }, // Nigeria
  ZA: { min: 9, max: 9 }, // South Africa
  KE: { min: 9, max: 9 }, // Kenya
  BR: { min: 10, max: 11 }, // Brazil
  MX: { min: 10, max: 10 }, // Mexico
  AR: { min: 10, max: 11 }, // Argentina
  CO: { min: 10, max: 10 }, // Colombia
  CL: { min: 9, max: 9 }, // Chile
  PE: { min: 9, max: 9 }, // Peru
};

const FALLBACK_RANGE = { min: 6, max: 15 };

// Returns the { min, max } local (post-dial-code) digit-length range for a
// country ISO code (e.g. 'IN'), or a generic fallback for anything not listed.
export const getPhoneLengthRange = (isoCode) => PHONE_LENGTH_BY_ISO[isoCode] || FALLBACK_RANGE;
