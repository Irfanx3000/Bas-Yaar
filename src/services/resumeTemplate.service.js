import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Admin-managed template gallery — GET /resume-templates (authenticated,
// active-only), same shape as documentTypes.service.js/jobTaxonomy.service.js.
let cached = null;

export const resumeTemplateService = {
  getActiveTemplates: async () => {
    if (!cached) {
      cached = apiClient
        .get(ENDPOINTS.RESUME_TEMPLATES)
        .then(({ data }) => data.data.templates)
        .catch((err) => {
          cached = null; // don't pin a failure — next call retries
          throw err;
        });
    }
    return cached;
  },
};
