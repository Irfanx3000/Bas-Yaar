// Maritime reference data for the onboarding "Maritime Profile" step and the
// Jobs filter. DEPARTMENTS/VESSEL_TYPES are now admin-manageable — these
// arrays serve only as the static fallback consumed by
// useJobTaxonomyOptions.js (used immediately on mount, before/if the live
// GET /job-taxonomies fetch resolves), not read directly elsewhere. RANKS/
// DESIGNATIONS remain fully static. Ranks are grouped by department so the
// Rank dropdown can be filtered to the chosen department.
//
// Option shape matches SearchablePickerSheet: { value, label }.

const opt = (label) => ({ value: label, label });

// ── Departments ───────────────────────────────────────────────────────────────
export const DEPARTMENTS = [
  'Deck',
  'Engine',
  'Electrical',
  'Catering / Galley',
  'Hotel / Hospitality',
  'Medical',
].map(opt);

// ── Ranks, grouped by department ──────────────────────────────────────────────
const RANKS = {
  Deck: [
    'Master (Captain)',
    'Chief Officer',
    'Second Officer',
    'Third Officer',
    'Deck Cadet',
    'Bosun',
    'Able Seaman (AB)',
    'Ordinary Seaman (OS)',
  ],
  Engine: [
    'Chief Engineer',
    'Second Engineer',
    'Third Engineer',
    'Fourth Engineer',
    'Engine Cadet',
    'Fitter',
    'Motorman',
    'Oiler',
    'Wiper',
  ],
  Electrical: [
    'Electro-Technical Officer (ETO)',
    'Chief Electrician',
    'Electrician',
  ],
  'Catering / Galley': [
    'Chief Cook',
    'Second Cook',
    'Assistant Cook',
    'Messman',
    'Steward',
  ],
  'Hotel / Hospitality': [
    'Hotel Director',
    'Food & Beverage Manager',
    'Restaurant Manager',
    'Head Waiter',
    'Waiter',
    'Bartender',
    'Cabin Steward',
    'Housekeeping Supervisor',
    'Receptionist',
  ],
  Medical: [
    'Ship Doctor',
    'Ship Nurse',
  ],
};

// Returns the rank options for a given department value (or [] if none selected).
export const getRankOptions = (departmentValue) =>
  (RANKS[departmentValue] || []).map(opt);

// ── Designations (seniority / position category) ──────────────────────────────
export const DESIGNATIONS = [
  'Trainee / Cadet',
  'Rating',
  'Petty Officer',
  'Junior Officer',
  'Senior Officer',
  'Head of Department',
  'Management',
].map(opt);

// ── Vessel Types ──────────────────────────────────────────────────────────────
export const VESSEL_TYPES = [
  'Cruise',
  'Container',
  'Tanker',
  'Bulk Carrier',
  'Offshore',
  'LNG Carrier',
  'LPG Carrier',
  'Chemical Tanker',
  'Ro-Ro',
  'Tug',
].map(opt);

