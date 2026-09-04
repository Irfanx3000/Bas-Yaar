import { PLAN_THEMES } from '../constants/subscription.constants';

// tier → card theme key (SAME mapping subscription.service.js uses to build plan
// cards) so a purchased plan looks identical everywhere it appears.
const THEME_BY_TIER = { start: 'purple', premium: 'blue', elite: 'gold' };

// Fallback labels when the status payload doesn't carry the plan name.
export const TIER_LABEL = { start: 'Crew Start', premium: 'Crew Premium', elite: 'Crew Elite' };

// A single solid tier color for the small indicators (Sidebar pill, Profile icon).
// The full gradient theme is used for the Home container.
export const TIER_ACCENT = { start: '#7C3AED', premium: '#056DEC', elite: '#D97706' };
export const TIER_BADGE_BG = { start: '#EDE9FE', premium: '#EFF5FF', elite: '#FEF3C7' };

// Renew nudge fires when the plan is this close to expiry.
export const RENEW_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatExpiry = (date) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Normalize the /subscription/me status object into a display descriptor shared by
 * the Home container, Profile row, and Sidebar badge — one source of truth for the
 * plan name, colors (matched to the plan's own card), expiry text and renew nudge.
 *
 * @param {object|null} subscription - { active, tier, status, billingCycle, currentPeriodEnd, plan }
 */
export function getPlanDisplay(subscription, now = new Date()) {
  const isActive = !!subscription?.active;
  const tier = isActive ? subscription.tier : null;

  if (!isActive || !tier) {
    return {
      isActive: false,
      tier: null,
      planName: null,
      themeKey: null,
      theme: null,
      accent: '#94A3B8', // neutral grey for the "Free plan" indicators
      badgeBg: '#F1F5F9',
      billingCycle: null,
      expiryDate: null,
      expiryLabel: null,
      daysLeft: null,
      isExpiringSoon: false,
    };
  }

  const themeKey = THEME_BY_TIER[tier] || 'purple';
  const expiryDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / MS_PER_DAY) : null;

  return {
    isActive: true,
    tier,
    planName: subscription.plan?.name || TIER_LABEL[tier] || 'Subscription',
    themeKey,
    theme: PLAN_THEMES[themeKey], // the SAME gradient/color set the plan card uses
    accent: TIER_ACCENT[tier] || '#056DEC',
    badgeBg: TIER_BADGE_BG[tier] || '#EFF5FF',
    billingCycle: subscription.billingCycle || null,
    expiryDate,
    expiryLabel: expiryDate ? formatExpiry(expiryDate) : null,
    daysLeft,
    isExpiringSoon: daysLeft != null && daysLeft >= 0 && daysLeft <= RENEW_WINDOW_DAYS,
  };
}
