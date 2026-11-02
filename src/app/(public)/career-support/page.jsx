"use client";

import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";
import { useTranslation } from "react-i18next";

export default function CareerSupportPage() {
  const { t } = useTranslation();
  const resources = [
    {
      titleKey: "web.landing.careerSupport.resources.mentorship.title",
      descKey: "web.landing.careerSupport.resources.mentorship.desc",
      icon: "user",
      link: "/consultancy"
    },
    {
      titleKey: "web.landing.careerSupport.resources.interview.title",
      descKey: "web.landing.careerSupport.resources.interview.desc",
      icon: "education",
      link: "/interview-prep"
    },
    {
      titleKey: "web.landing.careerSupport.resources.documents.title",
      descKey: "web.landing.careerSupport.resources.documents.desc",
      icon: "file-alt",
      link: "/documents"
    },
    {
      titleKey: "web.landing.careerSupport.resources.resume.title",
      descKey: "web.landing.careerSupport.resources.resume.desc",
      icon: "pencil-alt",
      link: "/resume"
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
            {t("web.landing.careerSupport.title")}<span className="text-primary">{t("web.landing.careerSupport.titleHighlight")}</span>
          </h1>
          <p className="text-lg md:text-xl text-body max-w-3xl mx-auto">
            {t("web.landing.careerSupport.subtitle")}
          </p>
        </section>

        {/* Resource Hub Cards */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resources.map((res, i) => (
              <Link href={res.link} key={i} className="group bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-line-soft hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon name={res.icon} size={24} />
                </div>
                <h3 className="text-2xl font-bold text-heading mb-4 group-hover:text-primary transition-colors">{t(res.titleKey)}</h3>
                <p className="text-body leading-relaxed flex-1 mb-6">{t(res.descKey)}</p>
                <div className="flex items-center gap-2 text-primary font-bold">
                  {t("web.landing.careerSupport.explore")} <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Card */}
        <section className="px-6 lg:px-12 max-w-4xl mx-auto">
          <div className="bg-heading rounded-3xl p-10 md:p-16 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t("web.landing.careerSupport.ctaTitle")}</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                {t("web.landing.careerSupport.ctaDesc")}
              </p>
              <Link href="/consultancy" className="inline-flex items-center justify-center bg-primary text-white rounded-full px-8 py-4 font-bold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:scale-105 transform">
                {t("web.landing.careerSupport.ctaButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
