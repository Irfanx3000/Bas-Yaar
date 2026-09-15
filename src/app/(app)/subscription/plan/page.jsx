"use client";

/* Plan Summary + payment — mirrors the app's PlanSummaryScreen and
 * usePlanSummary, including the fallbacks that exist because payments fail in
 * ways that are not failures.
 *
 * ── The summary is SERVER-COMPUTED ──────────────────────────────────────────
 * createOrder returns the whole thing: orderId, keyId, payableAmount, currency,
 * planName, tier, billingCycle, walletApplied, proratedCredit,
 * excessProrationCredit, scenario, priceBreakdown, newPeriodStart/End, reused,
 * activated. None of it can be recomputed here, and calling createOrder again
 * would open a SECOND order for one purchase — hence the handoff through
 * a stash, and a direct visit is sent back to choose rather than re-ordering.
 *
 * ── Three things that look like edge cases and are not ───────────────────────
 * 1. `activated: true` means credit or wallet already covered the whole amount.
 *    There is nothing to pay: skip Razorpay entirely and go to success. Opening
 *    a checkout for ₹0 would fail.
 * 2. A checkout ERROR does not mean the payment failed. The webhook may have
 *    captured it anyway, so re-check /me before telling anyone bad news — if the
 *    subscription is active, treat it as success.
 * 3. A verify() failure does not mean the payment failed either. The webhook is
 *    authoritative; verify is only the fast path. Re-check /me again, and only
 *    show "almost there" if it is still inactive.
 *
 * Cancelling is silent and stays on this page — the order is still valid.
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import RazorpayCheckout from "react-native-razorpay"; // aliased to the web checkout shim
import { subscriptionService } from "@/services/subscription.service";
import { walletService } from "@/services/wallet.service";
import { useSubscriptionStatus } from "@/context/SubscriptionContext";
import { useProfile } from "@/context/ProfileContext";
import { showAlert } from "@/utils/alertRef";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { t } from "@/i18n";
import { Button, Card, ErrorState, Icon } from "@/components/ui";
import { formatMoney, planSummaryStore, writePlanSummary } from "@/lib/planSummary";


/* Razorpay rejects with { code: 0 } / a description mentioning cancellation when
   the user dismisses the sheet. That is not an error worth showing. */
const isCancel = (err) =>
  err?.code === 0 ||
  /cancel/i.test(err?.description || err?.message || "");

function Line({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-md text-body">{label}</span>
      <span className={`text-md font-semibold ${tone === "credit" ? "text-success" : "text-heading"}`}>
        {value}
      </span>
    </div>
  );
}

export default function PlanSummaryPage() {
  const router = useRouter();
  const { profile } = useProfile() ?? {};
  const { refresh: refreshStatus } = useSubscriptionStatus() ?? {};

  /* Read through an external store, not an effect — see lib/planSummary.js.
     On the server this is null and the "choose a plan" state renders; on the
     client the real summary is available on the FIRST render, so there is no
     frame where a paying user sees an error. */
  const summary = useSyncExternalStore(
    planSummaryStore.subscribe,
    planSummaryStore.read,
    planSummaryStore.readOnServer,
  );
  const [processing, setProcessing] = useState(false);

  const goToSuccess = useCallback(
    (finalSummary) => {
      writePlanSummary(finalSummary);
      router.replace("/subscription/success");
    },
    [router],
  );

  const handleConfirm = async () => {
    if (processing || !summary) return;

    // Fully covered by prorated credit and/or wallet — nothing to charge.
    if (summary.activated) {
      goToSuccess(summary);
      return;
    }

    setProcessing(true);
    try {
      let payment;
      try {
        payment = await RazorpayCheckout.open({
          key: summary.keyId,
          order_id: summary.orderId,
          amount: summary.payableAmount,
          currency: summary.currency || "INR",
          name: "CrewApply",
          description: summary.planName,
          prefill: {
            email: profile?.email || "",
            contact: String(profile?.phone || "").replace(/^\+/, ""),
            name: profile?.name || "",
          },
          theme: { color: "#056DEC" },
        });
      } catch (checkoutErr) {
        if (isCancel(checkoutErr)) return; // dismissed — the order is still valid

        // The gateway reported a failure, but the webhook may have captured it.
        const status = await subscriptionService.getStatus().catch(() => null);
        if (status?.active) {
          await refreshStatus?.();
          goToSuccess({ ...summary, activated: true });
          return;
        }
        showAlert({
          type: "error",
          title: t("subscription.alerts.paymentFailedTitle"),
          message: checkoutErr?.description || t("subscription.alerts.paymentFailedBody"),
        });
        return;
      }

      // verify() is the fast path; the webhook is what actually decides.
      let verifyResult = null;
      try {
        verifyResult = await subscriptionService.verify(payment);
      } catch {
        const status = await subscriptionService.getStatus().catch(() => null);
        if (!status?.active) {
          showAlert({
            type: "warning",
            title: t("subscription.alerts.almostThereTitle"),
            message: t("subscription.alerts.almostThereBody"),
          });
          return;
        }
      }

      await refreshStatus?.();
      const walletBalanceAfter = await walletService
        .getWallet()
        .then((w) => w.balance)
        .catch(() => summary.walletBalanceAfter);

      goToSuccess({
        ...summary,
        activated: true,
        subscription: verifyResult
          ? {
              tier: verifyResult.tier,
              billingCycle: verifyResult.billingCycle,
              currentPeriodEnd: verifyResult.currentPeriodEnd,
            }
          : summary.subscription,
        walletBalanceAfter,
      });
    } catch (err) {
      showAlert({
        type: "error",
        title: t("subscription.alerts.couldNotSubscribeTitle"),
        message: getErrorMessage(err),
      });
    } finally {
      setProcessing(false);
    }
  };

  /* Direct visit, refresh, or a cleared session. There is nothing to price
     without a tier, so send them back to choose rather than inventing one. */
  if (!summary) {
    return (
      <div className="mx-auto max-w-2xl px-[15px] py-6 lg:px-6">
        <ErrorState
          message="Choose a plan to see its summary."
          onRetry={() => router.replace("/subscription")}
        />
      </div>
    );
  }

  /* priceBreakdown is an ARRAY of { label, amount, kind } — charge rows plus a
     final total — and every amount is in MINOR UNITS. Rendering it raw would
     have shown "20000" for ₹200. */
  const rows = Array.isArray(summary.priceBreakdown) ? summary.priceBreakdown : [];
  const total = rows.find((r) => r.kind === "total");
  const currency = summary.currency || "INR";

  return (
    <div className="mx-auto max-w-2xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">Order Summary</h1>
        <p className="mt-[2px] text-md text-body">Review before you pay.</p>
      </header>

      <Card radius="lg">
        <div className="flex items-start justify-between gap-3 border-b border-line-soft pb-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-heading">{summary.planName}</p>
            <p className="text-sm text-body capitalize">{summary.billingCycle}</p>
          </div>
          <Icon name="tag" size={18} className="shrink-0 text-primary" />
        </div>

        {/* The server decides which rows exist and what they are called —
            plan price, promo, prorated credit, wallet — so they are rendered as
            given rather than reconstructed from individual fields. A credit row
            is signalled by a negative amount. */}
        <div className="divide-y divide-line-soft py-2">
          {rows
            .filter((row) => row.kind !== "total")
            .map((row) => (
              <Line
                key={row.label}
                label={row.label}
                value={formatMoney(row.amount, currency)}
                tone={row.amount < 0 ? "credit" : undefined}
              />
            ))}
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t border-line-soft pt-3">
          <span className="text-md font-bold text-heading">{total?.label ?? "Amount Payable"}</span>
          <span className="text-h3 font-extrabold text-primary">
            {formatMoney(total?.amount ?? summary.payableAmount, currency)}
          </span>
        </div>

        {summary.newPeriodEnd ? (
          <p className="mt-2 text-sm text-hint">
            Active until {new Date(summary.newPeriodEnd).toLocaleDateString()}
          </p>
        ) : null}
      </Card>

      {summary.activated ? (
        <p className="mt-3 rounded-md bg-success-light px-4 py-3 text-md font-semibold text-success-text">
          Your credit covers this in full — there is nothing to pay.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
        <Button fullWidth loading={processing} onClick={handleConfirm} icon="check-circle">
          {summary.activated ? "Confirm" : "Pay now"}
        </Button>
        <Button fullWidth variant="outline" disabled={processing} onClick={() => router.back()}>
          Change plan
        </Button>
      </div>

      <p className="mt-3 text-center text-sm text-hint">
        Payments are processed by Razorpay. Card details never reach CrewApply.
      </p>
    </div>
  );
}
