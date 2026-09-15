import { BILLING_CYCLES } from "@/constants/subscription.constants";

/* Monthly / Yearly toggle.
 *
 * The saving chip read a hardcoded "Save up to 30%". The API returns
 * `yearlyDiscountPercent` — currently 20 — so the page was advertising a
 * discount that does not exist. It is now driven by that value and hidden
 * entirely when the API sends none, because an empty promise is worse than no
 * promise on a pricing page.
 */
export function BillingSwitcher({ cycle, onChange, discountPercent }) {
  const tab = (value, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={cycle === value}
      onClick={() => onChange(value)}
      className={`cursor-pointer rounded-pill px-6 py-2.5 text-sm font-bold transition-colors duration-[180ms] ease-standard ${
        cycle === value ? "bg-primary text-on-primary shadow-sm" : "text-body hover:text-heading"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="my-8 flex flex-wrap items-center justify-center gap-3">
      <div role="tablist" aria-label="Billing cycle" className="flex items-center rounded-pill bg-primary-light p-1">
        {tab(BILLING_CYCLES.MONTHLY, "Monthly")}
        {tab(BILLING_CYCLES.YEARLY, "Yearly")}
      </div>

      {discountPercent ? (
        <span className="inline-flex items-center rounded-pill bg-success-light px-4 py-1.5 text-xs font-bold tracking-tight text-success-text uppercase">
          Save {discountPercent}% yearly
        </span>
      ) : null}
    </div>
  );
}

export default BillingSwitcher;
