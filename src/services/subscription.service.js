import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// tier → card theme (matches PLAN_THEMES keys in subscription.constants.js)
const THEME_BY_TIER = { start: 'purple', premium: 'blue', elite: 'gold' };

// Amounts are in the smallest currency unit (paise for INR, cents for USD) —
// region (and therefore currency) is resolved server-side from the user's own
// country, so this must format whichever currency actually comes back rather
// than assuming INR.
const formatMoney = (smallestUnit, currency) => {
  const value = Number(smallestUnit || 0) / 100;
  if (currency === 'INR') return `₹${value.toLocaleString('en-IN')}`;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Map a backend plan (amount in the plan's own currency, tier) → the shape
// SubscriptionPlanCard renders.
const toCardPlan = (p) => {
  const monthly = p.billingCycle === 'monthly';
  const hasLaunch = p.launchAmount != null && p.launchAmount !== p.amount;
  return {
    id: p.id, // 'crew-premium'
    tier: p.tier, // 'premium' — needed for the order call
    billingCycle: p.billingCycle,
    name: p.name,
    subtitle: p.subtitle,
    theme: THEME_BY_TIER[p.tier] || 'purple',
    // Big price = launch (promo) if present, else the standard price.
    launchPrice: formatMoney(hasLaunch ? p.launchAmount : p.amount, p.currency),
    launchLabel: hasLaunch ? (monthly ? 'For First Month' : 'For First Year') : (monthly ? 'per month' : 'Yearly'),
    // "then …" line only shown when there's a launch promo.
    thenPrice: hasLaunch ? formatMoney(p.amount, p.currency) : null,
    thenLabel: monthly ? 'per month' : 'Yearly',
    buttonLabel: `CHOOSE ${(p.name || '').toUpperCase()}`,
    features: p.features || [],
    // raw values kept for callers
    amount: p.amount,
    currency: p.currency,
    intervalDays: p.intervalDays,
  };
};

export const subscriptionService = {
  // Returns the plans for one billing cycle (card shape) plus the yearly-offer
  // badge's savings % — auto-computed server-side from real monthly vs. yearly
  // prices for the requesting user's own region (admin can override it; see
  // CrewApply-backend's pricingSetting.service.js). One request serves both.
  async getPlans(billingCycle) {
    const { data } = await apiClient.get(ENDPOINTS.SUBSCRIPTION.PLANS);
    const grouped = data.data || {};
    return {
      plans: (grouped[billingCycle] || []).map(toCardPlan),
      yearlyDiscountPercent: grouped.yearlyDiscountPercent ?? null,
    };
  },

  // Current subscription status: { active, tier, status, currentPeriodEnd, plan }
  async getStatus() {
    const { data } = await apiClient.get(ENDPOINTS.SUBSCRIPTION.ME);
    return data.data;
  },

  // Create (or reuse) an order — server computes everything (amount, any
  // prorated switch credit, wallet credit, the classified scenario) and
  // returns the full "Plan Summary" object the PlanSummaryScreen renders
  // directly: { orderId, keyId, payableAmount, currency, planId, planName,
  // tier, billingCycle, walletApplied, proratedCredit, excessProrationCredit,
  // scenario, priceBreakdown, currentPlan?, newPeriodStart, newPeriodEnd,
  // reused, activated, subscription?, walletBalanceAfter? }.
  // `activated: true` means the order was fully covered by credit/wallet and
  // already went live server-side — no Razorpay checkout needed at all.
  async createOrder(tier, billingCycle) {
    const { data } = await apiClient.post(ENDPOINTS.SUBSCRIPTION.ORDER, { tier, billingCycle });
    return data.data;
  },

  // Verify a completed payment (signature-checked server-side) → returns status.
  async verify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const { data } = await apiClient.post(ENDPOINTS.SUBSCRIPTION.VERIFY, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return data.data;
  },
};
