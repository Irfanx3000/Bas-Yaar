import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

export function PlanCard({ tier, price, originalPrice, perks, isPopular, isElite, onSelect, subscribing }) {
  const isPremium = tier === 'Premium';
  
  const cardBorder = isPremium ? "border-primary border-[1.5px]" : (isElite ? "border-secondary border" : "border-line-soft border");
  const headerBg = isPremium ? "bg-primary text-on-primary" : (isElite ? "bg-secondary text-on-secondary" : "bg-primary-light text-primary");
  const btnVariant = isPremium || isElite ? "solid" : "outline";
  const btnTone = isElite ? "secondary" : "primary";
  const iconColor = isElite ? "text-secondary" : "text-primary";
  const cardBg = isPremium ? "bg-primary-light/30" : "bg-surface";

  return (
    <Card radius="lg" elevation={isPremium ? "md" : "sm"} padding="none" className={`relative overflow-visible ${cardBorder} ${cardBg} flex flex-col pt-2 h-full`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-xs font-bold px-4 py-1 rounded-pill flex items-center gap-1.5 shadow-sm whitespace-nowrap">
          <span className="text-sm">👑</span> Most Popular
        </div>
      )}
      
      <div className={`p-6 pb-4 text-center border-b ${isPremium ? 'border-primary/10' : 'border-line-soft'}`}>
        <h3 className={`text-h3 font-extrabold ${isElite ? 'text-secondary-dark' : (isPremium ? 'text-primary-vivid' : 'text-heading')}`}>Crew {tier}</h3>
        <p className="text-body text-sm mt-1">
          {tier === 'Start' ? 'For Getting Started' : tier === 'Premium' ? 'For serious job seeker' : 'For Maximum Opportunity'}
        </p>
      </div>

      <div className="p-6 flex flex-col lg:flex-col sm:flex-row gap-6 flex-1">
        <div className={`rounded-xl p-5 flex flex-col items-center justify-center ${headerBg} shadow-sm w-full sm:w-1/2 lg:w-full shrink-0`}>
          <span className={`text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 rounded-sm mb-2 ${isPremium || isElite ? 'bg-white/25 text-white' : 'bg-primary-vivid/10 text-primary-vivid'}`}>LAUNCH OFFER</span>
          <div className="flex items-start">
            <span className="text-xl font-bold mt-1.5">₹</span>
            <span className="text-h1 font-extrabold leading-none">{price}</span>
          </div>
          <span className="text-xs font-medium mt-2">For First Month</span>
          {originalPrice && <span className="text-[10px] mt-2 opacity-80">then, ₹{originalPrice} per month</span>}
        </div>
        
        <ul className="flex flex-col gap-3 justify-center w-full sm:w-1/2 lg:w-full">
          {perks.map((perk, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-body font-medium">
              <span className={`${iconColor} mt-0.5 shrink-0`}><Icon name="check-circle" size={16} /></span>
              <span className="leading-snug">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pt-0 mt-auto w-full">
        <Button 
          fullWidth 
          variant={btnVariant} 
          tone={btnTone} 
          onClick={onSelect}
          loading={subscribing}
        >
          CHOOSE CREW {tier.toUpperCase()}
        </Button>
      </div>
    </Card>
  );
}
