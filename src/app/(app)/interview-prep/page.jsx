"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useTranslation } from "react-i18next";

const INTERVIEW_STEPS = [
  { key: "interviewPrep.phases.applicationReview" },
  { key: "interviewPrep.phases.documentVerification" },
  { key: "interviewPrep.phases.screeningInterview" },
  { key: "interviewPrep.phases.technicalInterview" },
  { key: "interviewPrep.phases.finalOffer" }
];

const INTERVIEW_TIPS = [
  "interviewPrep.tips.certificates",
  "interviewPrep.tips.seaTime",
  "interviewPrep.tips.research",
  "interviewPrep.tips.punctuality",
  "interviewPrep.tips.questions",
  "interviewPrep.tips.documents"
];

export default function InterviewPrepPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 md:px-8">
      {/* Header */}
      <div className="relative mb-10">
        <Button 
          variant="text" 
          icon="arrow-left" 
          onClick={() => router.back()} 
          className="absolute top-1 left-0 !px-2 z-10" 
        />
        <div className="text-center px-10 sm:px-12">
          <h1 className="text-h3 sm:text-h2 font-extrabold text-heading leading-tight">{t("interviewPrep.screenTitle")}</h1>
          <p className="text-body text-sm mt-2">{t("interviewPrep.screenSubtitle")}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: The Interview Process */}
        <Card radius="lg" elevation="sm" padding="none" className="flex flex-col h-full border-line-soft">
          <div className="p-6 border-b border-line-soft flex gap-4 items-center bg-canvas rounded-t-lg">
            <div className="size-10 rounded-round bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Icon name="ship" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-heading leading-tight">{t("interviewPrep.phasesTitle")}</h2>
              <p className="text-sm text-body mt-1">{t("interviewPrep.phasesSubtitle")}</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-4 top-2 bottom-6 w-[2px] bg-line-input -ml-[1px]" />
              
              <ul className="flex flex-col gap-8 relative z-10">
                {INTERVIEW_STEPS.map((step, idx) => (
                  <li key={idx} className="flex gap-4 items-start">
                    <div className="size-8 rounded-round bg-primary text-on-primary font-bold text-sm flex items-center justify-center shrink-0 shadow-sm border-2 border-surface relative z-10">
                      {idx + 1}
                    </div>
                    <div className="mt-1">
                      <h3 className="font-bold text-heading text-md">{t(`${step.key}.title`)}</h3>
                      <p className="text-sm text-body mt-1 leading-relaxed">{t(`${step.key}.description`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Right Column: Interview Tips */}
        <Card radius="lg" elevation="sm" padding="none" className="flex flex-col h-full border-line-soft">
          <div className="p-6 border-b border-line-soft flex gap-4 items-center bg-canvas rounded-t-lg">
            <div className="size-10 rounded-round bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Icon name="lightbulb" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-heading leading-tight">{t("interviewPrep.tipsTitle")}</h2>
              <p className="text-sm text-body mt-1">{t("web.account.interviewPrep.tipsSubtitle")}</p>
            </div>
          </div>
          
          <div className="p-6">
            <ul className="flex flex-col gap-6">
              {INTERVIEW_TIPS.map((tip, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <div className="text-primary shrink-0 mt-[1px]">
                    <Icon name="check-circle" size={22} />
                  </div>
                  <p className="text-sm text-body leading-relaxed">{t(tip)}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>

      </div>
    </div>
  );
}
