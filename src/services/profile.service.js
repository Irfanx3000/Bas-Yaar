import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { toMediaUrl } from '../constants/app.constants';
import { PROFILE_MENU_ITEMS } from '../constants/profile.constants';

export const profileService = {
  getProfile: async () => {
    const { data } = await apiClient.get(ENDPOINTS.USER.PROFILE);
    // Backend returns user fields flat in data.data (not nested under data.data.user)
    const u = data.data;
    const mp = u.maritimeProfile || {};
    return {
      id: u.id || u._id,
      firstName: u.name?.split(' ')[0] || '',
      lastName: u.name?.split(' ').slice(1).join(' ') || '',
      name: u.name || '',
      // Rank/designation for the profile + sidebar labels
      rank: mp.rank || mp.designation || mp.department || null,
      email: u.email || '',
      phone: u.phone || '',
      location: u.currentLocation || u.city || null,
      // Resolve the stored relative path (uploads/profile/x.webp) to a loadable URL
      avatarUrl: toMediaUrl(u.avatar),
      profileCompletion: u.profileCompletion ?? 0,
      maritimeProfile: mp,
    };
  },

  getProfileCompletion: async () => {
    const { data } = await apiClient.get(ENDPOINTS.USER.PROFILE);
    return {
      percentage: data.data.profileCompletion,
      message: 'Complete profile to get better job matches',
    };
  },

  // Returns local constants — no backend endpoint needed
  getProfileMenu: async () => PROFILE_MENU_ITEMS,

  updateProfile: async (profileData) => {
    const { data } = await apiClient.patch(ENDPOINTS.USER.PROFILE, profileData);
    return { success: true, data: data.data };
  },

  updateMaritimeProfile: async (maritimeData) => {
    const { data } = await apiClient.patch(
      ENDPOINTS.USER.MARITIME_PROFILE,
      maritimeData
    );
    return { success: true, data: data.data };
  },
};
