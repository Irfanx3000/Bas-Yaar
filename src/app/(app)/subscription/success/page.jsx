"use client";

/* Subscription success — the app's SubscriptionSuccessScreen.
 *
 * Reads the finished summary the payment page stashed. It is deliberately
 * tolerant of an empty stash: someone can land here from a browser refresh or a
 * restored tab, and the subscription is already active either way — so a missing
 * summary shows the generic confirmation rather than an error. The purchase is
 * not in doubt at this point; only the receipt detail is.
 *
 * The stash is cleared on unmount so a later visit cannot re-show a stale receipt
 * for a purchase that has since changed.
 */

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button, Card, Icon } from "@/components/ui";
import { clearPlanSummary, planSummaryStore } from "@/lib/planSummary";

export default function SubscriptionSuccessPage() {
  const summary = useSyncExternalStore(
    planSummaryStore.subscribe,
    planSummaryStore.read,
    planSummaryStore.readOnServer,
  );

  /* Cleared on unmount rather than on mount: clearing immediately would wipe the
     value this render is displaying. A later visit then gets the generic
     confirmation instead of a stale receipt. */
  useEffect(() => clearPlanSummary, []);

  const periodEnd = summary?.subscription?.currentPeriodEnd ?? summary?.newPeriodEnd;

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-2xl items-center px-[15px] pb-8 lg:px-6">
      <Card radius="lg" elevation="md" className="w-full text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-round bg-success-light text-success">
          <Icon name="check-circle" size={30} />
        </span>

        <h1 className="mt-4 text-h2 font-extrabold text-heading">You&apos;re subscribed</h1>
        <p className="mt-1 text-md text-body">
          {summary?.planName
            ? `${summary.planName} is active on your account.`
            : "Your plan is active on your account."}
        </p>

        {periodEnd ? (
          <p className="mt-3 rounded-md bg-primary-light px-4 py-2 text-md font-semibold text-primary">
            Active until {new Date(periodEnd).toLocaleDateString()}
          </p>
        ) : null}

        {summary?.walletBalanceAfter != null ? (
          <p className="mt-2 text-sm text-hint">Wallet balance: {summary.walletBalanceAfter}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Link href="/jobs" className="flex-1">
            <Button fullWidth icon="search">
              Browse jobs
            </Button>
          </Link>
          <Link href="/subscription" className="flex-1">
            <Button fullWidth variant="outline">
              Manage plan
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
