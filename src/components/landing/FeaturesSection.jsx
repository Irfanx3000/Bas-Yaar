"use client";

import { Icon } from '@/components/ui/Icon';
import { useTranslation } from "react-i18next";

export function FeaturesSection() {
  const { t } = useTranslation();
  const features = [
    {
      titleKey: "web.landing.features.items.discover.title",
      descriptionKey: "web.landing.features.items.discover.description",
      icon: "search"
    },
    {
      titleKey: "web.landing.features.items.buildProfile.title",
      descriptionKey: "web.landing.features.items.buildProfile.description",
      icon: "file-alt"
    },
    {
      titleKey: "web.landing.features.items.manageDocuments.title",
      descriptionKey: "web.landing.features.items.manageDocuments.description",
      icon: "folder"
    },
    {
      titleKey: "web.landing.features.items.trackApplications.title",
      descriptionKey: "web.landing.features.items.trackApplications.description",
      icon: "chart-bar"
    }
  ];

  return (
    <section className="w-full bg-[#f8fafc] pt-12 lg:pt-16 pb-4 lg:pb-6 px-6 lg:px-12 border-t border-line-soft">
      <div className="max-w-[1440px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-8 lg:mb-12 gap-6">
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <h2 className="text-sm font-bold tracking-wide text-muted uppercase mb-2 block lg:hidden">
              {t("web.landing.features.eyebrow")}
            </h2>
            <h3 className="text-h2 lg:text-h1 font-extrabold leading-tight mb-2">
              <span className="text-heading">{t("web.landing.features.title")}</span><br className="hidden lg:block" />
              <span className="text-primary lg:ml-2">{t("web.landing.features.titleHighlight")}</span>
            </h3>
            <p className="text-lg text-body font-medium">
              {t("web.landing.features.subtitle")}
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-3 bg-surface p-4 rounded-2xl shadow-sm border border-line-soft max-w-sm mt-2">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary shrink-0">
              <Icon name="ship" size={20} />
            </div>
            <p className="text-sm font-bold text-heading leading-snug">
              {t("web.landing.common.motto")}
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-surface p-5 rounded-xl border border-line-soft shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="bg-primary-light text-primary w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Icon name={feature.icon} size={20} />
              </div>
              <h4 className="text-xl font-bold text-heading mb-2">{t(feature.titleKey)}</h4>
              <p className="text-md text-body leading-relaxed">{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>
        
        {/* Mobile Motto */}
        <div className="mt-8 flex lg:hidden items-center justify-center gap-3 bg-surface p-4 rounded-2xl shadow-sm border border-line-soft mx-auto max-w-sm">
          <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary shrink-0">
            <Icon name="ship" size={20} />
          </div>
          <p className="text-sm font-bold text-heading leading-snug text-left">
            {t("web.landing.common.motto")}
          </p>
        </div>
      </div>
    </section>
  );
}
