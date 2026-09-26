// Instant fallback shown before jobTaxonomyService.getCategories() resolves
// (same "static constant as immediate fallback, live data replaces it"
// pattern as useJobTaxonomyOptions.js for Department/Vessel Type) — shaped
// exactly like a real JobTaxonomy row so CategoryCard/CategorySection don't
// need to handle two different shapes. Matches what's actually seeded
// server-side today (see
// CrewApply-backend/src/scripts/redistributeJobCategories.js).
//
// Hotel keeps icon key 'hospitality': that's the name of the bundled asset,
// and the artwork is a hotel — renaming the file would mean touching the icon
// maps in the app, the web and the admin panel for no visible gain.
export const CATEGORIES = [
  { name: 'Deck', labelKey: 'categories.deck', icon: { type: 'default', key: 'deck' } },
  { name: 'Engine', labelKey: 'categories.engine', icon: { type: 'default', key: 'engine' } },
  { name: 'Hotel', labelKey: 'categories.hotel', icon: { type: 'default', key: 'hospitality' } },
  { name: 'Others', labelKey: 'categories.others', icon: { type: 'default', key: 'others' } },
];
