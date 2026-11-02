"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from "react-i18next";

export function DocumentsSection() {
  const { t } = useTranslation();
  const documentCards = [
    { labelKey: "web.landing.documents.cards.cv", icon: "file-alt", color: "text-primary" },
    { labelKey: "jobs.docTypes.passport", icon: "map-marker-alt", color: "text-emerald-500" },
    { labelKey: "web.landing.documents.cards.certificates", icon: "graduation-cap", color: "text-cyan-500" },
    { labelKey: "web.landing.documents.cards.otherDocuments", icon: "folder-open", color: "text-purple-500" }
  ];

  return (
    <section className="w-full bg-[#f8fafc] pt-4 lg:pt-6 pb-12 lg:pb-24 px-6 lg:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="relative w-full rounded-[2rem] overflow-hidden bg-surface shadow-sm border border-line-soft">
          {/* Background image which contains the passport & CV graphics embedded on the right */}
          <div className="absolute inset-0 z-0">
             <Image 
               src="/banner 1.png"
               alt={t("web.landing.documents.imageAlt")}
               fill
               className="object-cover object-center lg:object-right"
             />
             {/* Gradient overlay to ensure text readability on the left side */}
             <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/80 to-transparent lg:w-2/3" />
             <div className="absolute inset-0 bg-surface/80 lg:hidden" /> {/* extra overlay for mobile */}
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row min-h-[500px]">
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 max-w-2xl">
              <h2 className="text-sm font-bold tracking-wide text-muted uppercase mb-3 block lg:hidden">
                {t("web.landing.documents.eyebrow")}
              </h2>
              <h3 className="text-h2 lg:text-h1 font-extrabold leading-tight mb-4">
                <span className="hidden lg:inline text-heading">{t("web.landing.documents.title")}</span>
                <span className="text-heading lg:hidden">{t("web.landing.documents.titleMobile")}</span>
                <span className="text-primary lg:hidden">{t("web.landing.documents.titleMobileHighlight")}</span>
              </h3>
              <p className="text-lg text-body font-medium mb-10 max-w-lg">
                {t("web.landing.documents.subtitle")}
              </p>

              {/* Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {documentCards.map((card, i) => (
                  <div key={i} className="bg-white border border-line-soft rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center gap-3 hover:border-primary transition-all text-center group cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl bg-[#f8fafc] flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                      <Icon name={card.icon} size={20} />
                    </div>
                    <span className="text-sm font-bold text-heading">{t(card.labelKey)}</span>
                  </div>
                ))}
              </div>

              <Link href="/documents" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                {t("web.landing.documents.learnMore")} <span>&rarr;</span>
              </Link>
            </div>
            
            {/* Right side is intentionally empty to let the background graphic show */}
            <div className="hidden lg:block flex-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
