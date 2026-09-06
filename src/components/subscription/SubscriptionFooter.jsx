import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

export function SubscriptionFooter() {
  return (
    <div className="flex flex-col gap-6 mt-12 mb-8 max-w-3xl mx-auto">
      <Card radius="md" padding="md" elevation="none" className="bg-canvas border-0 flex items-start gap-4">
        <div className="text-body opacity-60 mt-1 shrink-0">
          <Icon name="info-circle" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-heading">Important Information</h4>
          <p className="text-xs text-body leading-relaxed mt-1">
            Crew Connect helps candidates discover and apply for cruise ship jobs. We do not guarantee job placement or hiring outcomes. Final decisions are made by recruiters and cruise companies.
          </p>
        </div>
      </Card>
      
      <div className="flex items-center justify-center gap-2 text-xs text-body opacity-80">
        <Icon name="lock" size={12} />
        <p>By continuing, you agree to our Terms & Privacy Policy.</p>
      </div>
    </div>
  );
}
