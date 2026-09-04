import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { subscriptionService } from '../services/subscription.service';
import { useSubscriptionStatus } from '../context/SubscriptionContext';
import { getPlanDisplay } from '../utils/subscriptionDisplay';
import { getErrorMessage } from '../i18n/getErrorMessage';
import { BILLING_CYCLES } from '../constants/subscription.constants';
import { ROUTES } from '../constants/routes.constants';
import { showAlert } from '../utils/alertRef';

// Owns the plan-list screen: fetching plans, the billing-cycle toggle, and
// selecting a plan. Selecting a plan no longer opens Razorpay directly — it
// asks the server to compute the full "Plan Summary" (amount, any prorated
// switch credit, wallet credit, the classified scenario) and hands off to
// PlanSummaryScreen, which owns the actual payment confirmation (see
// usePlanSummary.js). Users must always see what they're being charged and
// why before any charge happens.
export function useSubscription(navigation) {
  const { t } = useTranslation();
  const { isActive, tier: activeTier, subscription, loading: isStatusLoading, refresh: refreshStatus } = useSubscriptionStatus();

  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES.MONTHLY);
  const [plans, setPlans] = useState([]);
  const [yearlyDiscountPercent, setYearlyDiscountPercent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [subscribing, setSubscribing] = useState(null); // plan.id currently processing

  // `silent` skips the loading/error UI for background polls — the user
  // already has the last-good prices on screen, so a transient poll failure
  // shouldn't blank that out or flash a spinner over it.
  const loadPlans = useCallback(async (cycle, { silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setLoadError(null);
    }
    try {
      const result = await subscriptionService.getPlans(cycle);
      setPlans(result.plans);
      setYearlyDiscountPercent(result.yearlyDiscountPercent);
    } catch (e) {
      if (!silent) {
        setLoadError(e?.message || t('subscription.loadError'));
        setPlans([]);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [t]);

  // Refetch immediately on focus, then keep polling quietly in the
  // background while this screen stays open — so an admin's price change
  // shows up within ~20s without the user needing to navigate away and back,
  // without standing up a WebSocket server for it. Kept deliberately modest
  // (not a few seconds) since this shares a per-IP rate-limit budget with
  // every other screen in the app (see config.rateLimit.general).
  useFocusEffect(
    useCallback(() => {
      loadPlans(billingCycle);
      refreshStatus();

      const interval = setInterval(() => {
        loadPlans(billingCycle, { silent: true });
        refreshStatus();
      }, 20000);

      return () => clearInterval(interval);
    }, [billingCycle, loadPlans, refreshStatus])
  );

  const handleToggleBilling = useCallback((cycle) => setBillingCycle(cycle), []);

  const handleSelectPlan = useCallback(async (planId) => {
    if (subscribing) return; // guard double-tap / concurrent taps
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    // Only the literal same plan (tier AND billing cycle) counts as "already
    // on this plan" — a different tier or a different cycle of the same tier
    // (e.g. monthly -> yearly) is a genuine switch, handled by the summary
    // screen with prorated credit, not blocked here.
    const isSameSelection = activeTier === plan.tier && subscription?.billingCycle === plan.billingCycle;
    const canRenew = getPlanDisplay(subscription).isExpiringSoon && isSameSelection;
    if (isActive && isSameSelection && !canRenew) {
      showAlert({
        type: 'warning',
        title: t('subscription.alerts.alreadySubscribedTitle'),
        message: t('subscription.alerts.onThisPlan'),
      });
      return;
    }

    setSubscribing(planId);
    try {
      const summary = await subscriptionService.createOrder(plan.tier, billingCycle);
      navigation.navigate(ROUTES.PLAN_SUMMARY, { summary });
    } catch (err) {
      const code = err?.data?.code;
      if (code === 'PAYMENT_ALREADY_MADE') {
        // A previous payment we didn't get confirmation for actually went
        // through — the server just activated it. Reflect that, don't error.
        await refreshStatus();
        showAlert({ type: 'success', title: t('subscription.alerts.paymentReceivedTitle'), message: getErrorMessage(err, t) });
      } else if (code === 'ALREADY_SUBSCRIBED') {
        showAlert({ type: 'warning', title: t('subscription.alerts.alreadySubscribedTitle'), message: getErrorMessage(err, t) });
      } else if (code === 'PAYMENTS_NOT_CONFIGURED') {
        showAlert({ type: 'error', title: t('subscription.alerts.unavailableTitle'), message: t('subscription.alerts.unavailableBody') });
      } else {
        showAlert({ type: 'error', title: t('subscription.alerts.couldNotSubscribeTitle'), message: getErrorMessage(err, t) });
      }
    } finally {
      setSubscribing(null);
    }
  }, [subscribing, plans, isActive, activeTier, billingCycle, subscription, refreshStatus, navigation, t]);

  return {
    billingCycle,
    plans,
    yearlyDiscountPercent,
    isLoading,
    loadError,
    subscribing,
    isActive,
    isStatusLoading,
    activeTier,
    subscription,
    handleToggleBilling,
    handleSelectPlan,
    reloadPlans: () => loadPlans(billingCycle),
    // Dedicated to pull-to-refresh — silent so it doesn't swap the plan
    // cards out for a spinner over already-loaded content (unlike
    // reloadPlans, used by the Retry button where that IS the point).
    refreshPlansSilently: () => loadPlans(billingCycle, { silent: true }),
    refreshStatus,
  };
}
