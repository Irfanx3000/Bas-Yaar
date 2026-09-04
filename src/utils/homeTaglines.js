// Builds the Home header's rotating tagline list: relevant data-driven
// messages first (only the ones that currently apply, so a brand-new
// account with nothing yet doesn't show empty/zero stats), generic taglines
// mixed in for variety and as a fallback. Every message is kept short — this
// renders as a single line under the user's name (see HomeHeader.jsx).
export function buildHomeTaglines(t, {
  featuredJobsCount = 0,
  savedJobsCount = 0,
  cvPercent = 0,
  activeApplicationsCount = 0,
} = {}) {
  const messages = [];

  if (featuredJobsCount > 0) {
    messages.push(t('home.header.taglines.jobsAvailable', { count: featuredJobsCount }));
  }
  if (activeApplicationsCount > 0) {
    messages.push(t('home.header.taglines.activeApplications', { count: activeApplicationsCount }));
  }
  if (cvPercent > 0 && cvPercent < 100) {
    messages.push(t('home.header.taglines.cvIncomplete', { percent: cvPercent }));
  }
  if (savedJobsCount > 0) {
    messages.push(t('home.header.taglines.jobsSaved', { count: savedJobsCount }));
  }

  // Always end with at least one general tagline — pure filler when there's
  // no data yet, and a change of pace mixed into the rotation otherwise so
  // it doesn't read as a plain stat ticker.
  messages.push(t('home.header.taglines.findVoyage'));
  if (messages.length < 2) {
    messages.push(t('home.header.exploreCareer'));
  }

  return messages;
}
