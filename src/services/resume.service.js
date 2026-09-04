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

  // asset: { uri, name, type } — same shape DocumentUploadModal.jsx's file
  // picker already produces.
  async uploadResume(asset) {
    const formData = new FormData();
    formData.append('file', { uri: asset.uri, name: asset.name, type: asset.type });

    const { data } = await apiClient.post(ENDPOINTS.USER.RESUME, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data.data.document;
  },
};
