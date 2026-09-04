import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Admin-managed Department / Vessel Type lists — change essentially never
// during a session, but the Jobs filter modal and onboarding's Maritime
// Profile step both want them on mount — cache the in-flight/resolved
// promise per type so repeat calls resolve instantly instead of re-hitting
// the network every time. Mirrors documentTypes.service.js's exact pattern.
const cache = { department: null, vesselType: null };

function fetchType(type) {
  if (!cache[type]) {
    cache[type] = apiClient
      .get(ENDPOINTS.JOB_TAXONOMIES, { params: { type } })
      .then(({ data }) => data.data.jobTaxonomies.map((t) => ({ value: t.name, label: t.name })))
      .catch((err) => {
        cache[type] = null; // don't pin a failure — next call retries
        throw err;
      });
  }
  return cache[type];
}

// Categories carry more than a name (an icon), so they get their own fetch
// (kept out of the `cache`/fetchType() value-label mapping above) rather
// than reusing fetchType()'s narrower shape. Still cached the same way —
// resolves instantly on repeat calls (Home screen + Jobs screen both want it).
let categoriesPromise = null;
function fetchCategories() {
  if (!categoriesPromise) {
    categoriesPromise = apiClient
      .get(ENDPOINTS.JOB_TAXONOMIES, { params: { type: 'category' } })
      .then(({ data }) => data.data.jobTaxonomies)
      .catch((err) => {
        categoriesPromise = null;
        throw err;
      });
  }
  return categoriesPromise;
}

export const jobTaxonomyService = {
  getDepartments: () => fetchType('department'),
  getVesselTypes: () => fetchType('vesselType'),
  getCategories: () => fetchCategories(),
};
