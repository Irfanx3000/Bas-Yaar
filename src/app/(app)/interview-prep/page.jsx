"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const INTERVIEW_STEPS = [
  {
    title: "Application & Profile Review",
    desc: "The manning agent or recruiter reviews your Career Profile, resume, and rank against the job's requirements."
  },
  {
    title: "Document & Certificate Verification",
    desc: "Your STCW certificates, COC, medical fitness, passport, and CDC are checked for validity and expiry."
  },
  {
    title: "Screening Interview",
    desc: "A short call with HR or the manning agent covering your availability, sea time, and basic rank suitability."
  },
  {
    title: "Technical Interview",
    desc: "In-depth questions on your rank-specific duties, safety procedures, and vessel-type experience — usually with a senior officer or technical superintendent."
  },
  {
    title: "Final Interview & Offer",
    desc: "A final round with the shipping company or principal, followed by an offer and joining formalities if you're selected."
  }
];

const INTERVIEW_TIPS = [
  "Keep your STCW, COC, medical, and CDC certificates valid and easy to share — recruiters check these early.",
  "Be ready to discuss your sea time in detail: vessel types, routes, and rank-specific responsibilities.",
  "Research the company and the vessel type you're applying for before the interview.",
  "For video or phone interviews, join on time from a quiet location with a stable connection.",
  "Prepare clear answers for common questions: why this vessel or company, how you handle emergencies, and safety procedures for your rank.",
  "Keep digital copies of all required documents ready to share immediately if you're shortlisted."
];

export default function InterviewPrepPage() {
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
          <h1 className="text-h3 sm:text-h2 font-extrabold text-heading leading-tight">Interview Prep</h1>
          <p className="text-body text-sm mt-2">What to expect once you&apos;re shortlisted for a job.</p>
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
              <h2 className="text-lg font-bold text-heading leading-tight">The Interview Process</h2>
              <p className="text-sm text-body mt-1">Most maritime recruitment interviews follow these 5 phases.</p>
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
                      <h3 className="font-bold text-heading text-md">{step.title}</h3>
                      <p className="text-sm text-body mt-1 leading-relaxed">{step.desc}</p>
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
              <h2 className="text-lg font-bold text-heading leading-tight">Interview Tips for Seafarers</h2>
              <p className="text-sm text-body mt-1">Simple tips to help you perform better.</p>
            </div>
          </div>
          
          <div className="p-6">
            <ul className="flex flex-col gap-6">
              {INTERVIEW_TIPS.map((tip, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <div className="text-primary shrink-0 mt-[1px]">
                    <Icon name="check-circle" size={22} />
                  </div>
                  <p className="text-sm text-body leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>

      </div>
    </div>
  );
}
