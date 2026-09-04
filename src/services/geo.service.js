import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Cities now come from the backend (see CrewApply-backend's geo.service.js)
// instead of a bundled 7.7MB city.json — see geo.utils.js for why parsing
// that file on-device was the cause of the step-2 crash-on-open.
export const geoService = {
  getCities: async (countryCode, stateCode) => {
    const { data } = await apiClient.get(ENDPOINTS.GEO.CITIES, {
      params: { country: countryCode, state: stateCode },
    });
    return data.data.cities;
  },
};
