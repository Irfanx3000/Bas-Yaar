import { useState, useCallback } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { useTranslation } from 'react-i18next';
import { subscriptionService } from '../services/subscription.service';
import { walletService } from '../services/wallet.service';
import { useProfile } from '../context/ProfileContext';
import { useSubscriptionStatus } from '../context/SubscriptionContext';
import { getErrorMessage } from '../i18n/getErrorMessage';
import { ROUTES } from '../constants/routes.constants';
import { showAlert } from '../utils/alertRef';

// Was the checkout dismissed by the user (vs a real failure)?
const isCancel = (err) => {
  const desc = String(err?.description || err?.reason || err?.error?.description || '').toLowerCase();
  return err?.code === 0 || err?.code === 'PAYMENT_CANCELLED' || desc.includes('cancel');
};

// Owns PlanSummaryScreen's single action: confirming what's already been
// computed and shown. `summary` is the order-creation response — if it's
// already `activated` (fully covered by prorated/wallet credit), there is
// nothing left to pay and Razorpay never opens, per the product spec's
// "DO NOT OPEN RAZORPAY" rule for a zero-payable order. Otherwise this opens
// Checkout for the already-known amount and verifies it exactly like the
// plan screen used to do inline.
export function usePlanSummary(summary, navigation) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { refresh: refreshStatus } = useSubscriptionStatus();
  const [isProcessing, setIsProcessing] = useState(false);

  const goToSuccess = useCallback((finalSummary) => {
    navigation.replace(ROUTES.SUBSCRIPTION_SUCCESS, { summary: finalSummary });
  }, [navigation]);

  const handleConfirm = useCallback(async () => {
    if (isProcessing) return;

    if (summary.activated) {
      goToSuccess(summary);
      return;
    }

    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      showAlert({
        type: 'warning',
        title: t('subscription.alerts.updateRequiredTitle'),
        message: t('subscription.alerts.updateRequiredBody'),
      });
      return;
    }

    setIsProcessing(true);
    try {
      let payment;
      try {
        payment = await RazorpayCheckout.open({
          key: summary.keyId,
          order_id: summary.orderId,
          amount: summary.payableAmount,
          currency: summary.currency || 'INR',
          name: 'CrewApply',
          description: summary.planName,
          prefill: {
            email: profile?.email || '',
            contact: String(profile?.phone || '').replace(/^\+/, ''),
            name: profile?.name || '',
          },
          theme: { color: '#056DED' },
        });
      } catch (checkoutErr) {
        if (isCancel(checkoutErr)) return; // user dismissed — stay on the summary screen
        // Gateway reported a failure — but the webhook may still have captured it.
        const status = await subscriptionService.getStatus().catch(() => null);
        if (status?.active) {
          await refreshStatus();
          goToSuccess({ ...summary, activated: true });
          return;
        }
        showAlert({
          type: 'error',
          title: t('subscription.alerts.paymentFailedTitle'),
          message: checkoutErr?.description || t('subscription.alerts.paymentFailedBody'),
        });
        return;
      }

      // Verify (fast path). If it fails, the webhook is authoritative — re-check /me.
      let verifyResult = null;
      try {
        verifyResult = await subscriptionService.verify(payment);
      } catch {
        const status = await subscriptionService.getStatus().catch(() => null);
        if (!status?.active) {
          showAlert({ type: 'warning', title: t('subscription.alerts.almostThereTitle'), message: t('subscription.alerts.almostThereBody') });
          return;
        }
      }

      await refreshStatus();
      const walletBalanceAfter = await walletService.getWallet().then((w) => w.balance).catch(() => summary.walletBalanceAfter);
      goToSuccess({
        ...summary,
        activated: true,
        subscription: verifyResult
          ? { tier: verifyResult.tier, billingCycle: verifyResult.billingCycle, currentPeriodEnd: verifyResult.currentPeriodEnd }
          : summary.subscription,
        walletBalanceAfter,
      });
    } catch (err) {
      showAlert({ type: 'error', title: t('subscription.alerts.couldNotSubscribeTitle'), message: getErrorMessage(err, t) });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, summary, profile, refreshStatus, goToSuccess, t]);

  return { isProcessing, handleConfirm };
}
