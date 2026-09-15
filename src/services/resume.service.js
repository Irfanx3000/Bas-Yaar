import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// The user's single uploaded resume (category:'resume' Document) — a
// different, older code path than the Career Profile Engine's *generated*
// resumes (see resumeConfiguration.service.js). This wraps the plumbing
// endpoints.js already had (ENDPOINTS.USER.RESUME) but nothing in the app
// called yet.
export const resumeService = {
  // Returns the current active resume Document, or null if none uploaded.
  async getResume() {
    const { data } = await apiClient.get(ENDPOINTS.USER.RESUME);
    return data.data.document;
  },

  // WEB: `asset` is the File the user picked. React Native's FormData takes
  // { uri, name, type }; a browser stringifies that object to "[object Object]"
  // and multer receives no file. Same divergence, same reason, as
  // documents.service.js — see the long note there.
  async uploadResume(asset) {
    const formData = new FormData();
    formData.append('file', asset, asset.name);

    const { data } = await apiClient.post(ENDPOINTS.USER.RESUME, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data.data.document;
  },
};
