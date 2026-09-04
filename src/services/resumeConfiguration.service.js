import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Named, tailored resumes ("Chief Officer Resume", "General Resume") — each
// a thin selection/override layer over the user's single Career Profile,
// never a copy of its content. See CrewApply-backend's resumeConfiguration
// model/service for the full shape.
export const resumeConfigurationService = {
  getResumes: async () => {
    const { data } = await apiClient.get(ENDPOINTS.RESUME_CONFIGURATIONS.LIST);
    return data.data.resumes;
  },

  getResumeById: async (id) => {
    const { data } = await apiClient.get(ENDPOINTS.RESUME_CONFIGURATIONS.DETAIL(id));
    return data.data.resume;
  },

  createResume: async (payload) => {
    const { data } = await apiClient.post(ENDPOINTS.RESUME_CONFIGURATIONS.CREATE, payload);
    return data.data.resume;
  },

  updateResume: async (id, payload) => {
    const { data } = await apiClient.patch(ENDPOINTS.RESUME_CONFIGURATIONS.UPDATE(id), payload);
    return data.data.resume;
  },

  deleteResume: async (id) => {
    await apiClient.delete(ENDPOINTS.RESUME_CONFIGURATIONS.DELETE(id));
  },

  // Explicit action only — this is the one call that actually produces a
  // PDF. Returns the Document (id/path/etc.) so the caller can hand it to
  // the existing PDF viewer pipeline.
  renderResume: async (id, format = 'pdf') => {
    const { data } = await apiClient.post(ENDPOINTS.RESUME_CONFIGURATIONS.RENDER(id), { format });
    return data.data.document;
  },

  getHistory: async (id) => {
    const { data } = await apiClient.get(ENDPOINTS.RESUME_CONFIGURATIONS.HISTORY(id));
    return data.data.history;
  },
};
