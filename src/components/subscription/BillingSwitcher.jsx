import { BILLING_CYCLES } from "@/constants/subscription.constants";

export function BillingSwitcher({ cycle, onChange }) {
  return (
    <div className="flex items-center justify-center gap-4 my-8">
      <div className="flex items-center bg-primary-light rounded-pill p-1">
        <button
          onClick={() => onChange(BILLING_CYCLES.MONTHLY)}
          className={`px-6 py-2.5 rounded-pill font-bold text-sm transition-colors ${cycle === BILLING_CYCLES.MONTHLY ? 'bg-primary text-on-primary shadow-sm' : 'text-body hover:text-heading'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange(BILLING_CYCLES.YEARLY)}
          className={`px-6 py-2.5 rounded-pill font-bold text-sm transition-colors ${cycle === BILLING_CYCLES.YEARLY ? 'bg-primary text-on-primary shadow-sm' : 'text-body hover:text-heading'}`}
        >
          Yearly
        </button>
      </div>
      <span className="inline-flex items-center rounded-pill px-4 py-1.5 text-xs font-bold bg-success-light text-success-text uppercase tracking-tight">
        Save up to 30%
      </span>
    </div>
  );
}
