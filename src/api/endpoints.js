// All backend API endpoint paths — mirrors CrewApply-backend routes exactly.
// Update here when the backend adds new routes; never hardcode paths in services.

export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    SEND_OTP: '/auth/send-otp',
    VERIFY_MOBILE: '/auth/verify-mobile',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    RESEND_VERIFICATION: '/auth/resend-verification',
    GOOGLE: '/auth/google',
  },

  USER: {
    PROFILE: '/user/profile',
    MARITIME_PROFILE: '/user/maritime-profile',
    PREFERENCES: '/user/preferences',
    PROFILE_PHOTO: '/user/profile-photo',
    RESUME: '/user/resume',
    CERTIFICATES: '/user/certificates',
    CERTIFICATE: (id) => `/user/certificates/${id}`,
    PASSPORT: '/user/passport',
    CDC: '/user/cdc',
    MEDICAL: '/user/medical',
    VISA: '/user/visa',
    VISA_ITEM: (id) => `/user/visa/${id}`,
    DOCUMENTS: '/user/documents',
    DOCUMENT_BY_ID: (id) => `/user/documents/${id}`,
    DOCUMENT_VIEW_TOKEN: (id) => `/user/documents/${id}/view-token`,
    DOCUMENT_FILE: (id) => `/user/documents/${id}/file`,
    REFERRAL: '/user/referral',
    REFERRAL_GENERATE: '/user/referral/generate',
  },

  SUBSCRIPTION: {
    PLANS: '/subscription/plans',
    ORDER: '/subscription/order',
    VERIFY: '/subscription/verify',
    ME: '/subscription/me',
  },

  JOBS: {
    LIST: '/jobs',
    DETAIL: (id) => `/jobs/${id}`,
  },

  SEARCH: '/search',

  GEO: {
    CITIES: '/geo/cities',
  },

  SAVED_JOBS: {
    LIST: '/saved-jobs',
    SAVE: (jobId) => `/saved-jobs/${jobId}`,
    REMOVE: (jobId) => `/saved-jobs/${jobId}`,
  },

  JOB_ALERTS: {
    LIST: '/job-alerts',
  },

  APPLICATIONS: {
    LIST: '/applications',
    CREATE: '/applications',
    DETAIL: (id) => `/applications/${id}`,
    WITHDRAW: (id) => `/applications/${id}/withdraw`,
    ELIGIBILITY: (jobId) => `/applications/eligibility/${jobId}`,
  },

  DOCUMENT_TYPES: '/document-types',
  JOB_TAXONOMIES: '/job-taxonomies',

  CAREER_PROFILE: {
    GET: '/user/career-profile',
    UPDATE_OBJECTIVE: '/user/career-profile',
    ADD_ENTRY: (section) => `/user/career-profile/${section}`,
    UPDATE_ENTRY: (section, entryId) => `/user/career-profile/${section}/${entryId}`,
    REMOVE_ENTRY: (section, entryId) => `/user/career-profile/${section}/${entryId}`,
  },

  RESUME_TEMPLATES: '/resume-templates',

  RESUME_CONFIGURATIONS: {
    LIST: '/user/resume-configurations',
    CREATE: '/user/resume-configurations',
    DETAIL: (id) => `/user/resume-configurations/${id}`,
    UPDATE: (id) => `/user/resume-configurations/${id}`,
    DELETE: (id) => `/user/resume-configurations/${id}`,
    RENDER: (id) => `/user/resume-configurations/${id}/render`,
    HISTORY: (id) => `/user/resume-configurations/${id}/history`,
  },

  BANNERS: {
    LIST: '/banners',
  },

  CONSULTANCY: {
    AVAILABILITY: '/consultancy/availability',
    SLOTS: '/consultancy/slots',
    FEE: '/consultancy/fee',
    ORDER: '/consultancy/order',
    VERIFY: '/consultancy/verify',
    BOOKINGS: '/consultancy/bookings',
    BOOKING_DETAIL: (id) => `/consultancy/bookings/${id}`,
  },

  WALLET: {
    GET: '/wallet',
    HISTORY: '/wallet/history',
    DETAIL: (id) => `/wallet/${id}`,
  },

  SUPPORT: {
    CREATE: '/support',
    CREATE_PUBLIC: '/support/public',
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DEVICE_TOKEN: '/notifications/device-token',
    SETTINGS: '/notifications/settings',
  },
};
