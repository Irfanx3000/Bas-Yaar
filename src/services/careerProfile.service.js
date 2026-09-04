import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Talks to the Career Profile Engine's /user/career-profile endpoints. The
// GET response is the fully resolved profile — native sections (experience,
// education, skills, languages, references) + live-aggregated sections
// (personal, contact, maritime, certificates, travelDocuments) + completion —
// exactly what the Career Profile screen renders directly.
export const careerProfileService = {
  getCareerProfile: async () => {
    const { data } = await apiClient.get(ENDPOINTS.CAREER_PROFILE.GET);
    return data.data.careerProfile;
  },

  updateCareerObjective: async (careerObjective) => {
    const { data } = await apiClient.patch(ENDPOINTS.CAREER_PROFILE.UPDATE_OBJECTIVE, { careerObjective });
    return data.data.careerProfile;
  },

  addEntry: async (section, entry) => {
    const { data } = await apiClient.post(ENDPOINTS.CAREER_PROFILE.ADD_ENTRY(section), entry);
    return data.data.entry;
  },

  updateEntry: async (section, entryId, entry) => {
    const { data } = await apiClient.patch(ENDPOINTS.CAREER_PROFILE.UPDATE_ENTRY(section, entryId), entry);
    return data.data.entry;
  },

  removeEntry: async (section, entryId) => {
    await apiClient.delete(ENDPOINTS.CAREER_PROFILE.REMOVE_ENTRY(section, entryId));
  },
};
