import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { toMediaUrl } from '../constants/app.constants';
import { PERSONAL_INFO_CONSTANTS } from '../constants/personalInformation.constants';
import { splitPhone } from '../utils/geo.utils';

// Stored ISO date → "DD-MM-YYYY" for the editable DOB field.
const toDDMMYYYY = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

export const personalInformationService = {
  getPersonalInformation: async () => {
    const { data } = await apiClient.get(ENDPOINTS.USER.PROFILE);
    // Backend returns user fields flat in data.data (not nested under data.data.user)
    const u = data.data;
    // Phone is stored as one combined "+<dialCode><localNumber>" string (see
    // registration's StayConnectedScreen) — split it so the dial code the
    // user picked at registration can be shown locked, with only the local
    // number editable. Falls back to a fully-editable plain field when the
    // stored value doesn't match a known dial code.
    const phoneParts = splitPhone(u.phone);
    return {
      fullName: u.name || '',
      dob: toDDMMYYYY(u.dateOfBirth),
      gender: u.gender?.toLowerCase() || null,
      nationality: u.nationality || null,
      maritalStatus: u.maritalStatus?.toLowerCase() || null,
      email: u.email || '',
      phone: phoneParts ? phoneParts.localNumber : (u.phone || ''),
      phoneDialCode: phoneParts?.dialCode || null,
      phoneFlag: phoneParts?.flag || null,
      phoneIso: phoneParts?.isoCode || null,
      altPhone: u.alternatePhone || null,
      location: u.currentLocation || null,
      photoUrl: toMediaUrl(u.avatar),
    };
  },

  updatePersonalInformation: async (formData) => {
    // Map frontend field names → backend field names
    const payload = {};
    if (formData.fullName !== undefined) payload.name = formData.fullName;
    if (formData.dob !== undefined) payload.dateOfBirth = formData.dob;
    if (formData.gender !== undefined) {
      payload.gender = formData.gender
        ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
        : formData.gender;
    }
    if (formData.maritalStatus !== undefined) {
      payload.maritalStatus = formData.maritalStatus
        ? formData.maritalStatus.charAt(0).toUpperCase() + formData.maritalStatus.slice(1)
        : formData.maritalStatus;
    }
    if (formData.phone !== undefined) {
      // Re-attach the locked dial code the local number was split from.
      payload.phone = formData.phoneDialCode ? `+${formData.phoneDialCode}${formData.phone}` : formData.phone;
    }
    if (formData.altPhone !== undefined) payload.alternatePhone = formData.altPhone;
    if (formData.location !== undefined) payload.currentLocation = formData.location;

    const { data } = await apiClient.patch(ENDPOINTS.USER.PROFILE, payload);
    return { success: true, data: data.data };
  },

  /**
   * @param {string} uri
   * @param {{x:number,y:number,width:number,height:number}} [crop] normalised
   *   rectangle from the adjuster. Omitted means "decide for me" — the server
   *   falls back to subject detection, which is also what older clients get.
   */
  uploadProfilePhoto: async (uri, crop = null) => {
    const filename = uri.split('/').pop();
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mime = mimeMap[ext] || 'image/jpeg';

    const formData = new FormData();
    // Backend expects the field named 'file' (profileUpload.single('file')).
    formData.append('file', { uri, name: filename, type: mime });

    // Sent as separate scalar fields rather than a JSON blob: multipart text
    // parts are strings either way, and four named numbers are far easier to
    // validate server-side than a string that has to be parsed before it can be
    // checked. The server ignores the crop unless all four arrive.
    if (crop) {
      formData.append('cropX', String(crop.x));
      formData.append('cropY', String(crop.y));
      formData.append('cropWidth', String(crop.width));
      formData.append('cropHeight', String(crop.height));
    }

    const { data } = await apiClient.patch(ENDPOINTS.USER.PROFILE_PHOTO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Backend stores a relative path (uploads/profile/x.webp) — resolve to a URL.
    return { success: true, photoUrl: toMediaUrl(data.data?.document?.path) || uri };
  },

  // Backend doesn't have a delete-photo endpoint yet — clear via profile update
  deleteProfilePhoto: async () => {
    await apiClient.patch(ENDPOINTS.USER.PROFILE, { avatar: null });
    return { success: true };
  },

  // These return local data — no backend endpoints needed
  getCountries: async () => PERSONAL_INFO_CONSTANTS.LOCATIONS,
  getNationalities: async () => PERSONAL_INFO_CONSTANTS.NATIONALITIES,
  getMaritalStatus: async () => PERSONAL_INFO_CONSTANTS.MARITAL_STATUS_OPTIONS,
  getGenderOptions: async () => PERSONAL_INFO_CONSTANTS.GENDER_OPTIONS,
};
