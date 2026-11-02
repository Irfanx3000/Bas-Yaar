"use client";

import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";
import { useTranslation } from "react-i18next";

export default function ForEmployersPage() {
  const { t } = useTranslation();
  const values = [
    {
      titleKey: "web.landing.forEmployers.values.vetted.title",
      descKey: "web.landing.forEmployers.values.vetted.desc",
      icon: "check-circle"
    },
    {
      titleKey: "web.landing.forEmployers.values.matching.title",
      descKey: "web.landing.forEmployers.values.matching.desc",
      icon: "search"
    },
    {
      titleKey: "web.landing.forEmployers.values.pipeline.title",
      descKey: "web.landing.forEmployers.values.pipeline.desc",
      icon: "chart-bar"
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
            {t("web.landing.forEmployers.title")}<span className="text-primary">{t("web.landing.forEmployers.titleHighlight")}</span>
          </h1>
          <p className="text-lg md:text-xl text-body max-w-3xl mx-auto">
            {t("web.landing.forEmployers.subtitle")}
          </p>
        </section>

        {/* Value Proposition Grid */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-line-soft hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Icon name={v.icon} size={24} />
                </div>
                <h3 className="text-xl font-bold text-heading mb-4">{t(v.titleKey)}</h3>
                <p className="text-body leading-relaxed">{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Inquiry Form / Lead Capture */}
        <section className="px-6 lg:px-12 max-w-3xl mx-auto">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-line-soft">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-heading mb-4">{t("web.landing.forEmployers.partnerTitle")}</h2>
              <p className="text-body">{t("web.landing.forEmployers.partnerDesc")}</p>
            </div>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">{t("profile.personalInfo.labels.fullName")}</label>
                  <input type="text" className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">{t("web.landing.forEmployers.form.companyName")}</label>
                  <input type="text" className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Oceanic Shipping Ltd." />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">{t("web.landing.forEmployers.form.workEmail")}</label>
                  <input type="email" className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">{t("web.landing.forEmployers.form.fleetSize")}</label>
                  <select className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="1-10 Vessels">{t("web.landing.forEmployers.form.fleetSmall")}</option>
                    <option value="11-50 Vessels">{t("web.landing.forEmployers.form.fleetMedium")}</option>
                    <option value="50+ Vessels">{t("web.landing.forEmployers.form.fleetLarge")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-2">{t("web.landing.forEmployers.form.hiringNeeds")}</label>
                <textarea rows={4} className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder={t("web.landing.forEmployers.form.hiringNeedsPlaceholder")}></textarea>
              </div>
              
              <button type="button" className="w-full bg-primary text-white font-bold rounded-xl py-4 hover:bg-primary-hover transition-colors shadow-sm">
                {t("web.landing.forEmployers.form.submit")}
              </button>
            </form>
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
