"use client";

import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";
import { useTranslation } from "react-i18next";

export default function HowItWorksPage() {
  const { t } = useTranslation();
  const steps = [
    {
      titleKey: "web.landing.howItWorks.steps.profile.title",
      descKey: "web.landing.howItWorks.steps.profile.desc",
      icon: "user",
      color: "bg-blue-50 text-blue-600"
    },
    {
      titleKey: "web.landing.howItWorks.steps.discover.title",
      descKey: "web.landing.howItWorks.steps.discover.desc",
      icon: "search",
      color: "bg-green-50 text-green-600"
    },
    {
      titleKey: "web.landing.howItWorks.steps.apply.title",
      descKey: "web.landing.howItWorks.steps.apply.desc",
      icon: "paper-plane",
      color: "bg-purple-50 text-purple-600"
    },
    {
      titleKey: "web.landing.howItWorks.steps.interview.title",
      descKey: "web.landing.howItWorks.steps.interview.desc",
      icon: "check-circle",
      color: "bg-orange-50 text-orange-600"
    }
  ];

  const faqs = [
    {
      qKey: "web.landing.howItWorks.faqs.costs.q",
      aKey: "web.landing.howItWorks.faqs.costs.a"
    },
    {
      qKey: "web.landing.howItWorks.faqs.security.q",
      aKey: "web.landing.howItWorks.faqs.security.a"
    },
    {
      qKey: "web.landing.howItWorks.faqs.verified.q",
      aKey: "web.landing.howItWorks.faqs.verified.a"
    }
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans">
      <div className="w-full relative bg-white">
        <Navbar />
      </div>
      
      <main className="flex-1 pt-32 pb-20">
        {/* Hero */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto text-center mb-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-heading mb-6 tracking-tight">
            {t("web.landing.howItWorks.title")}<span className="text-primary">{t("web.landing.howItWorks.titleHighlight")}</span>
          </h1>
          <p className="text-lg md:text-xl text-body max-w-3xl mx-auto">
            {t("web.landing.howItWorks.subtitle")}
          </p>
        </section>

        {/* 4-Step Timeline */}
        <section className="px-6 lg:px-12 max-w-4xl mx-auto mb-32">
          <div className="space-y-12 relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-8 top-8 bottom-8 w-1 bg-line-soft -z-10"></div>
            
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${step.color}`}>
                  <Icon name={step.icon} size={28} />
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-line-soft flex-1">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">{t("web.landing.howItWorks.step", { n: i + 1 })}</span>
                  <h3 className="text-xl font-bold text-heading mb-3">{t(step.titleKey)}</h3>
                  <p className="text-body leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seafarer FAQ Accordion (Simulated) */}
        <section className="px-6 lg:px-12 max-w-4xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-heading">{t("web.landing.howItWorks.faqTitle")}</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-line-soft">
                <h4 className="font-bold text-heading text-lg mb-3">{t(faq.qKey)}</h4>
                <p className="text-body leading-relaxed">{t(faq.aKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
