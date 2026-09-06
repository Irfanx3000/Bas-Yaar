"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionHeader } from "@/components/subscription/SubscriptionHeader";
import { BillingSwitcher } from "@/components/subscription/BillingSwitcher";
import { PlanCard } from "@/components/subscription/PlanCard";
import { SubscriptionFooter } from "@/components/subscription/SubscriptionFooter";
import { LoadingState, ErrorState } from "@/components/ui/Feedback";

const MOCKUP_TIERS = {
  Start: {
    perks: [
      "Apply to 10 jobs / month",
      "Access to basic cruise jobs",
      "Job alerts (App)",
      "Standard application support"
    ]
  },
  Premium: {
    perks: [
      "Apply to 20 jobs/month",
      "Access to premium cruise jobs",
      "Job alerts (Email + App)",
      "Priority application support"
    ],
    isPopular: true
  },
  Elite: {
    perks: [
      "Unlimited job applications",
      "Job alerts (Email + App)",
      "Priority support (WhatsApp)",
      "Early access to new jobs"
    ],
    isElite: true
  }
};

export default function SubscriptionPage() {
  const router = useRouter();
  
  const navigationAdapter = useMemo(() => ({
    navigate: (route, params) => {
      // Pass summary to the next screen via sessionStorage
      if (params?.summary) {
        sessionStorage.setItem('planSummary', JSON.stringify(params.summary));
      }
      router.push('/subscription/plan');
    }
  }), [router]);

  const {
    billingCycle,
    plans,
    isLoading,
    loadError,
    subscribing,
    handleToggleBilling,
    handleSelectPlan,
    reloadPlans
  } = useSubscription(navigationAdapter);

  // If loading without stale data
  if (isLoading && plans.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-[15px]">
        <SubscriptionHeader />
        <LoadingState text="Loading plans..." className="mt-12" />
      </div>
    );
  }

  // If errored without stale data
  if (loadError && plans.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-[15px]">
        <SubscriptionHeader />
        <ErrorState 
          message={loadError} 
          onRetry={reloadPlans} 
          className="mt-12"
        />
      </div>
    );
  }

  // For the display, if API returned plans, use them. 
  // We sort them to ensure Start -> Premium -> Elite.
  const displayPlans = [...plans].sort((a, b) => {
    const order = { Start: 1, Premium: 2, Elite: 3 };
    return (order[a.tier] || 99) - (order[b.tier] || 99);
  });

  return (
    <div className="relative min-h-[calc(100vh-60px)]">
      {/* Desktop Background Image */}
      <div 
        className="hidden md:block absolute inset-0 z-0 bg-no-repeat bg-cover bg-top"
        style={{ backgroundImage: "url('/subscription-bg.png')" }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4 md:px-8">
        <SubscriptionHeader />
        
        <BillingSwitcher cycle={billingCycle} onChange={handleToggleBilling} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 my-10 items-stretch">
          {displayPlans.map(plan => {
            const mockup = MOCKUP_TIERS[plan.tier] || { perks: [] };
            return (
              <PlanCard
                key={plan.id}
                tier={plan.tier}
                price={plan.price}
                originalPrice={plan.originalPrice}
                perks={mockup.perks}
                isPopular={mockup.isPopular}
                isElite={mockup.isElite}
                onSelect={() => handleSelectPlan(plan.id)}
                subscribing={subscribing === plan.id}
              />
            );
          })}
        </div>

        <SubscriptionFooter />
      </div>
    </div>
  );
}
