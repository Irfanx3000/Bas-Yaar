import { ROUTES } from './routes.constants';

export const PROFILE_MENU_ITEMS = [
  {
    // Opens the existing Personal Information bottom sheet directly (see
    // ProfileScreen.jsx's handleMenuItemPress) rather than via `route` — this
    // row has no dedicated stack screen of its own.
    id: 'personal_info',
    title: 'Personal Information',
    subtitle: 'Basic Personal Details',
    titleKey: 'profile.menu.personalInfo.title',
    subtitleKey: 'profile.menu.personalInfo.subtitle',
    icon: 'user',
    iconColor: '#2F80ED',
    iconBgColor: '#EAF3FF',
  },
  {
    id: 'documents',
    title: 'Documents',
    subtitle: 'Upload and Manage Documents',
    titleKey: 'profile.menu.documents.title',
    subtitleKey: 'profile.menu.documents.subtitle',
    icon: 'folder',
    iconColor: '#2F80ED',
    iconBgColor: '#EAF3FF',
    route: ROUTES.DOCUMENTS,
  },
  {
    id: 'cv_management',
    title: 'Your CV',
    subtitle: 'Career Profile & Resumes',
    titleKey: 'profile.menu.cv.title',
    subtitleKey: 'profile.menu.cv.subtitle',
    icon: 'file-alt',
    iconColor: '#2F80ED',
    iconBgColor: '#EAF3FF',
    route: ROUTES.CV_PREVIEW,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    subtitle: 'Upload and Manage Documents',
    titleKey: 'profile.menu.preferences.title',
    subtitleKey: 'profile.menu.preferences.subtitle',
    icon: 'dharmachakra',
    iconColor: '#2F80ED',
    iconBgColor: '#EAF3FF',
    route: ROUTES.PREFERENCES,
  },
  {
    id: 'app_history',
    title: 'Application History',
    subtitle: 'Track your job applications',
    titleKey: 'profile.menu.appHistory.title',
    subtitleKey: 'profile.menu.appHistory.subtitle',
    icon: 'clipboard-list',
    iconColor: '#2F80ED',
    iconBgColor: '#EAF3FF',
    route: ROUTES.APPLICATIONS,
  },
];

export const PROFILE_CONSTANTS = {
  COMPLETION_MESSAGE: 'Complete profile to get better job matches',
  SUPPORT_HELP_TEXT: 'Help your friends discover cruise job opportunities and start their journey at sea',
  SUPPORT_CTA: 'Contact Support',
  EDIT_PROFILE: 'Edit Profile',
  PERSONAL_OVERVIEW_HEADER: 'Personal Overview',
};
