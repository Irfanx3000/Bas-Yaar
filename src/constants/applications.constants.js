// How many application cards render per page (drives both the list and its
// loading skeleton, so the placeholder matches the real page size).
export const APPLICATIONS_PER_PAGE = 5;

export const APPLICATION_STATUS = {
  APPLIED: 'applied',
  UNDER_REVIEW: 'under_review',
  INTERVIEW: 'interview_scheduled',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  // Terminal, and the one status that frees the job to be applied to again
  // (the backend's duplicate check ignores withdrawn applications), which is
  // why AppliedJobsContext excludes it from "already applied".
  WITHDRAWN: 'withdrawn',
};

// badgeColor drives the count pill color on each inactive tab
export const APPLICATION_TABS = [
  { id: 'all', labelKey: 'applications.tabs.all', statuses: null, badgeColor: '#056DEC' },
  {
    id: 'active',
    labelKey: 'applications.tabs.active',
    statuses: [
      APPLICATION_STATUS.APPLIED,
      APPLICATION_STATUS.UNDER_REVIEW,
      APPLICATION_STATUS.INTERVIEW,
    ],
    badgeColor: '#0FA66A',
  },
  {
    id: 'selected',
    labelKey: 'applications.tabs.selected',
    statuses: [APPLICATION_STATUS.SELECTED],
    badgeColor: '#056DEC',
  },
  {
    id: 'closed',
    labelKey: 'applications.tabs.closed',
    statuses: [APPLICATION_STATUS.REJECTED],
    badgeColor: '#EC0509',
  },
];
