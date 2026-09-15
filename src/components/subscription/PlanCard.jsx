import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

/* A plan card, driven entirely by the mapped plan object.
 *
 * Everything here used to be hardcoded — the name ("Crew {tier}"), the subtitle,
 * the "₹" symbol, "For First Month", the "then, ₹X per month" line and the
 * button label. `toCardPlan` in subscription.service.js already produces all of
 * them, so the hardcoded versions were duplicates waiting to drift the moment an
 * admin edited a plan.
 *
 * The currency one was not cosmetic. Amounts come back in the smallest unit of
 * whichever currency the SERVER resolved from the user's country — the service's
 * own comment says so, and there are already KWD-priced records in this data. A
 * literal "₹" would have shown Kuwaiti prices in rupees.
 *
 * `theme` comes from THEME_BY_TIER (start → purple, premium → blue, elite →
 * gold), so the card does not re-derive a look from the tier string.
 */

const THEME = {
  blue: {
    card: "border-primary border-[1.5px] bg-primary-light/30",
    price: "bg-primary text-on-primary",
    title: "text-primary-vivid",
    chip: "bg-white/25 text-white",
    tick: "text-primary",
    button: { variant: "solid", tone: "primary" },
    elevation: "md",
  },
  gold: {
    card: "border-secondary border",
    price: "bg-secondary text-on-secondary",
    title: "text-secondary-dark",
    chip: "bg-white/25 text-white",
    tick: "text-secondary",
    button: { variant: "solid", tone: "secondary" },
    elevation: "sm",
  },
  purple: {
    card: "border-line-soft border",
    price: "bg-primary-light text-primary",
    title: "text-heading",
    chip: "bg-primary-vivid/10 text-primary-vivid",
    tick: "text-primary",
    button: { variant: "outline", tone: "primary" },
    elevation: "sm",
  },
};

export function PlanCard({ plan, isCurrent, subscribing, disabled, onSelect }) {
  const theme = THEME[plan.theme] ?? THEME.purple;
  const isPopular = plan.theme === "blue";

  return (
    <Card
      radius="lg"
      padding="none"
      elevation={theme.elevation}
      className={`relative flex h-full flex-col overflow-visible pt-2 ${theme.card}`}
    >
      {isPopular ? (
        <span className="bg-primary text-on-primary absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-pill px-4 py-1 text-xs font-bold whitespace-nowrap shadow-sm">
          <span aria-hidden="true">👑</span> Most Popular
        </span>
      ) : null}

      <div className="border-b border-line-soft p-6 pb-4 text-center">
        <h3 className={`text-h3 font-extrabold ${theme.title}`}>{plan.name}</h3>
        {plan.subtitle ? <p className="mt-1 text-sm text-body">{plan.subtitle}</p> : null}
      </div>

      {/* Price block beside the perks on a tablet, stacked either side of it —
          three narrow columns on desktop would squeeze both. */}
      <div className="flex flex-1 flex-col gap-6 p-6 sm:flex-row lg:flex-col">
        <div
          className={`flex w-full shrink-0 flex-col items-center justify-center rounded-xl p-5 shadow-sm sm:w-1/2 lg:w-full ${theme.price}`}
        >
          {plan.thenPrice ? (
            <span className={`mb-2 rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${theme.chip}`}>
              Launch Offer
            </span>
          ) : null}

          <span className="text-h1 leading-none font-extrabold">{plan.launchPrice}</span>
          <span className="mt-2 text-xs font-medium">{plan.launchLabel}</span>

          {/* Only rendered when there IS a promo — the mapper sets thenPrice to
              null otherwise, and "then ₹X" with no discount is a lie. */}
          {plan.thenPrice ? (
            <span className="mt-2 text-[10px] opacity-80">
              then {plan.thenPrice} {plan.thenLabel}
            </span>
          ) : null}
        </div>

        <ul className="flex w-full flex-col justify-center gap-3 sm:w-1/2 lg:w-full">
          {(plan.features ?? []).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm font-medium text-body">
              <Icon name="check-circle" size={16} className={`mt-0.5 shrink-0 ${theme.tick}`} />
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto w-full p-6 pt-0">
        <Button
          fullWidth
          variant={theme.button.variant}
          tone={theme.button.tone}
          loading={subscribing}
          /* Disabled while ANY plan is being selected, not just this one — two
             concurrent createOrder calls would open two orders for one purchase. */
          disabled={disabled || isCurrent}
          onClick={onSelect}
        >
          {isCurrent ? "Current Plan" : plan.buttonLabel}
        </Button>
      </div>
    </Card>
  );
}

export default PlanCard;
