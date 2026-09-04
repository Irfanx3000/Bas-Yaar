export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

// Mirrors CrewApply-backend/src/models/plan.model.js's TIER_RANK/isTierSufficient
// — used client-side to decide whether a job's minimumTier locks it for the
// current user (purely presentational; the backend is the enforcement source
// of truth at apply time).
export const TIER_RANK = { start: 1, premium: 2, elite: 3 };
export const isTierSufficient = (userTier, requiredTier) =>
  (TIER_RANK[userTier] || 0) >= (TIER_RANK[requiredTier] || TIER_RANK.start);

// The tier to recommend when a user hits their monthly application limit —
// elite never reaches this since its limit is unlimited (null).
export const NEXT_TIER = { start: 'premium', premium: 'elite' };

export const SUBSCRIPTION_COPY = {
  SCREEN_TITLE: 'Subscription and Plans',
  SCREEN_SUBTITLE: 'Choose the plan that helps you get closer to your dream job.',
  BANNER_HEADING: 'Unlock more opportunities',
  BANNER_BODY: 'Upgrade your plan to apply to more jobs, get featured and receive priority support.',
  LAUNCH_BADGE: 'LAUNCH OFFER',
  INFO_HEADING: 'Important Information',
  INFO_BODY:
    'Crew Connect helps candidates discover and apply for cruise ship jobs. We do not guarantee job placement or hiring outcomes. Final decisions are made by recruiters and cruise companies.',
  TERMS: 'By continuing, you agree to our Terms & Privacy Policy.',
};

// Color tokens per plan.
// priceSectionColors / badgeColors are arrays passed directly to LinearGradient.
// badgeSolid is used for glassmorphic badges (Premium / Elite) where no gradient is needed.
export const PLAN_THEMES = {
  // ── Crew Start ─────────────────────────────────────────────────────────
  purple: {
    cardBorderColor: 'rgba(0,0,0,0.06)',
    cardBorderWidth: 0.75,
    priceSectionColors: ['rgba(255, 255, 255, 0.2)', 'rgba(207, 228, 255, 0.2)'],
    badgeColors: ['rgba(138, 56, 245, 0.42)', 'rgba(28, 85, 232, 0.42)'],          // Figma gradient
    badgeGradientStart: { x: 0, y: 0.5 },
    badgeGradientEnd: { x: 1, y: 0.5 },
    badgeSolid: null,
    badgeBorderColor: 'rgba(255,255,255,0.30)',
    badgeTextColor: '#2E1E6B',
    priceColor: '#056DEC',
    priceLabelColor: '#556172',
    dividerColor: 'rgba(5,109,236,0.15)',
    thenColor: '#556172',
    titleColor: '#1A1A2E',
    checkBg: '#056DEC',
    buttonBg: 'transparent',
    buttonBorderColor: 'transparent',
    buttonTextColor: '#056DEC',
    buttonGradient: ['rgba(255, 255, 255, 0.2)', 'rgba(216, 216, 216, 0.2)'],
  },

  // ── Crew Premium ────────────────────────────────────────────────────────
  blue: {
    cardBorderColor: '#0A70EC',
    cardBorderWidth: 0.75,
    priceSectionColors: ['#549AEF', '#056DEC'],   // Figma: #549AEF → #056DEC
    badgeColors: ['rgba(255, 255, 255, 0.2)', 'rgba(171, 195, 255, 0.2)'],
    badgeSolid: null,
    badgeBorderColor: 'rgba(255,255,255,0.30)',
    badgeTextColor: '#FFFFFF',
    priceColor: '#FFFFFF',
    priceLabelColor: 'rgba(255,255,255,0.85)',
    dividerColor: 'rgba(255,255,255,0.28)',
    thenColor: 'rgba(255,255,255,0.75)',
    titleColor: '#056DEC',
    checkBg: '#056DEC',
    buttonBg: 'transparent',
    buttonBorderColor: 'transparent',
    buttonTextColor: '#FFFFFF',
    buttonGradient: ['#549AEF', '#056DEC'],
  },

  // ── Crew Elite ──────────────────────────────────────────────────────────
  gold: {
    cardBorderColor: '#FFC736',
    cardBorderWidth: 0.75,
    priceSectionColors: ['#FFC534', '#FFDB63'],   // Figma: #FFC534 → #FFDB63
    priceSectionGradientStart: { x: 0, y: 1 },    // 360deg is vertical bottom-to-top
    priceSectionGradientEnd: { x: 0, y: 0 },
    badgeColors: null,
    badgeSolid: 'rgba(255,255,255,0.28)',          // glassmorphic on gold
    badgeBorderColor: 'rgba(255,255,255,0.30)',
    badgeTextColor: '#7A4800',
    priceColor: '#1A1A2E',
    priceLabelColor: '#7A4800',
    dividerColor: 'rgba(0,0,0,0.12)',
    thenColor: '#7A4800',
    titleColor: '#D97706',
    checkBg: '#FFC534',
    buttonBg: 'transparent',
    buttonBorderColor: 'transparent',
    buttonTextColor: '#1A1A2E',
    buttonGradient: ['#FFC534', '#FFDB63'],
    buttonGradientStart: { x: 0, y: 1 },
    buttonGradientEnd: { x: 0, y: 0 },
  },
};
