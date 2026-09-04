// Instant fallback shown before jobTaxonomyService.getCategories() resolves
// (same "static constant as immediate fallback, live data replaces it"
// pattern as useJobTaxonomyOptions.js for Department/Vessel Type) — shaped
// exactly like a real JobTaxonomy row so CategoryCard/CategorySection don't
// need to handle two different shapes. Matches what's actually seeded
// server-side today (see CrewApply-backend/src/scripts/seedJobCategories.js).
export const CATEGORIES = [
  { name: 'Deck', labelKey: 'categories.deck', icon: { type: 'default', key: 'deck' } },
  { name: 'Engine', labelKey: 'categories.engine', icon: { type: 'default', key: 'engine' } },
  { name: 'Hospitality', labelKey: 'categories.hospitality', icon: { type: 'default', key: 'hospitality' } },
  { name: 'Catering', labelKey: 'categories.catering', icon: { type: 'default', key: 'catering' } },
  { name: 'Others', labelKey: 'categories.others', icon: { type: 'default', key: 'others' } },
];
