"use client";

/* Subscription & Plans — wired to the backend and mirroring the app.
 *
 * ── What was broken, and why it looked like "no working" ────────────────────
 * The merged version keyed two lookups on a CAPITALISED tier:
 *     MOCKUP_TIERS[plan.tier]   with keys Start / Premium / Elite
 *     order[a.tier]             same
 * but `tier` from the API is lowercase — 'start', 'premium', 'elite'. So every
 * lookup missed: perks were always `[]` and the sort always returned 99, i.e.
 * no sort. It also read `plan.price` / `plan.originalPrice`, which the mapper
 * does not produce.
 *
 * MOCKUP_TIERS is gone entirely. `toCardPlan` already maps the API's own
 * `features`, and those are byte-identical to the hardcoded perks — so the
 * constant was pure drift risk: the moment an admin edits a plan's features,
 * the web would keep showing the old list.
 *
 * ── The real card shape, from subscription.service.js ────────────────────────
 *   { id, tier, billingCycle, name, subtitle, theme,
 *     launchPrice, launchLabel, thenPrice, thenLabel,
 *     buttonLabel, features, amount, currency, intervalDays }
 */

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionHeader } from "@/components/subscription/SubscriptionHeader";
import { BillingSwitcher } from "@/components/subscription/BillingSwitcher";
import { PlanCard } from "@/components/subscription/PlanCard";
import { SubscriptionFooter } from "@/components/subscription/SubscriptionFooter";
import { ErrorState, LoadingState } from "@/components/ui";
import { writePlanSummary } from "@/lib/planSummary";

/* Lowercase, because that is what the API sends. */
const TIER_ORDER = { start: 1, premium: 2, elite: 3 };

export default function SubscriptionPage() {
  const router = useRouter();

  /* The copied hook calls navigation.navigate(ROUTES.PLAN_SUMMARY, { summary }).
     The summary is a server-computed object — prices, prorated credit, wallet
     credit, the classified scenario — so it cannot be rebuilt from a URL, and
     re-creating the order on the next page would issue a second order for the
     same purchase. sessionStorage carries it across the one hop, and
     /subscription/plan falls back to creating an order itself if someone lands
     there directly with nothing stashed. */
  const navigationAdapter = useMemo(
    () => ({
      navigate: (_route, params) => {
        if (params?.summary) writePlanSummary(params.summary);
        router.push("/subscription/plan");
      },
      replace: (_route, params) => {
        if (params?.summary) writePlanSummary(params.summary);
        router.replace("/subscription/plan");
      },
    }),
    [router],
  );

  const {
    billingCycle,
    plans,
    yearlyDiscountPercent,
    isLoading,
    loadError,
    subscribing,
    activeTier,
    subscription,
    handleToggleBilling,
    handleSelectPlan,
    reloadPlans,
  } = useSubscription(navigationAdapter);

  const displayPlans = useMemo(
    () => [...plans].sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99)),
    [plans],
  );

  const body = () => {
    if (isLoading && plans.length === 0) return <LoadingState rows={3} />;
    if (loadError && plans.length === 0) return <ErrorState message={loadError} onRetry={reloadPlans} />;

    return (
      /* auto-fit rather than lg:grid-cols-3: three plans today, but the count
         comes from the API and a fourth tier would silently break a fixed 3. */
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] items-stretch gap-4">
        {displayPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            /* Only the literal same plan — same tier AND same cycle — counts as
               current. A different cycle of the same tier is a real switch, and
               the summary screen prices it with prorated credit. */
            isCurrent={activeTier === plan.tier && subscription?.billingCycle === plan.billingCycle}
            subscribing={subscribing === plan.id}
            disabled={!!subscribing}
            onSelect={() => handleSelectPlan(plan.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative isolate min-h-dvh">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 hidden h-96 bg-cover bg-top bg-no-repeat md:block"
        style={{ backgroundImage: "url('/subscription-bg.png')" }}
      />

      <div className="mx-auto max-w-6xl px-[15px] pb-8 lg:px-6">
        <SubscriptionHeader />

        <BillingSwitcher
          cycle={billingCycle}
          onChange={handleToggleBilling}
          discountPercent={yearlyDiscountPercent}
        />

        <div className="my-6">{body()}</div>

        <SubscriptionFooter />
      </div>
    </div>
  );
}
