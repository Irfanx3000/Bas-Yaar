import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Admin-configured document types (resume, passport, medical, …) change
// essentially never during a session, but the Documents screen re-fetches
// them on every upload/delete/filter/page change alongside the user's actual
// documents — cache the in-flight/resolved promise so repeat calls resolve
// instantly instead of re-hitting the network every time.
let cached = null;

export const documentTypesService = {
  getActiveDocumentTypes: async () => {
    if (!cached) {
      cached = apiClient
        .get(ENDPOINTS.DOCUMENT_TYPES)
        .then(({ data }) => data.data.documentTypes)
        .catch((err) => {
          cached = null; // don't pin a failure — next call retries
          throw err;
        });
    }
    return cached;
  },
};
