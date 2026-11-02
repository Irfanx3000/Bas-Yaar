"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from "react-i18next";

export function GuidanceSection() {
  const { t } = useTranslation();
  const featureBadges = [];

  return (
    <section className="w-full bg-[#f8fafc] pb-12 lg:pb-24 pt-4 lg:pt-6 px-6 lg:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="relative w-full rounded-[2rem] overflow-hidden bg-surface shadow-sm border border-line-soft min-h-[500px] flex flex-col lg:flex-row">
          
          {/* Background Image Container */}
          <div className="absolute inset-0 z-0">
             <Image 
               src="/banner 2.png"
               alt={t("web.landing.guidance.imageAlt")}
               fill
               className="object-cover object-center lg:object-right"
             />
             {/* Gradient overlay for text readability */}
             <div className="absolute inset-0 bg-gradient-to-b from-surface/90 via-surface/60 to-transparent lg:bg-gradient-to-r lg:w-2/3" />
             <div className="absolute inset-0 bg-surface/50 lg:hidden" />
          </div>

          <div className="relative z-10 w-full flex flex-col lg:flex-row p-6 lg:p-16 h-full justify-between gap-10">
            
            {/* Left Content (Text & CTA) */}
            <div className="flex-1 flex flex-col justify-center max-w-md lg:max-w-lg z-20">
              <h2 className="text-sm font-bold tracking-wide text-muted uppercase mb-3">
                {t("web.landing.guidance.eyebrow")}
              </h2>
              <h3 className="text-h2 lg:text-h1 font-extrabold leading-tight mb-4">
                <span className="text-heading">{t("web.landing.guidance.title")}</span>
                <span className="text-primary">{t("web.landing.guidance.titleHighlight")}</span>
              </h3>
              <p className="text-lg text-body font-medium mb-8 max-w-md">
                {t("web.landing.guidance.subtitle")}
              </p>

              <div className="flex">
                <Link href="/consultancy" className="inline-flex items-center justify-center bg-primary text-white rounded-full px-6 py-3 font-semibold hover:bg-primary-hover transition-colors shadow-sm">
                  <span className="hidden lg:inline">{t("web.landing.guidance.bookConsultation")}</span>
                  <span className="lg:hidden inline-flex items-center gap-2">{t("web.landing.guidance.bookConsultation")} <span>&rarr;</span></span>
                </Link>
              </div>

              {/* Mobile-only elements - positioned below the main text on mobile, normally under the photo but flex-col pushes them down */}
              <div className="lg:hidden mt-8 flex flex-col gap-6">
                {/* Trusted by Professionals Card */}
                <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-100/80 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="flex -space-x-3 shrink-0">
                    {/* Placeholder Avatars */}
                    {[1, 2, 3].map((num, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-xs ${i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-emerald-400' : 'bg-purple-400'}`}>
                        {['JD', 'SM', 'AK'][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-semibold text-heading text-sm sm:text-base">{t("web.landing.guidance.trustedTitle")}</h4>
                    <p className="text-xs sm:text-sm text-body">{t("web.landing.guidance.trustedDesc")}</p>
                  </div>
                </div>
                
                {/* Playful Slogan */}
                <div className="text-right mt-2">
                  <p className="text-2xl font-medium text-primary inline-block" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-2deg)' }}>
                    {t("web.landing.common.slogan")}
                    <svg className="w-full h-2 text-primary/40 mt-1" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 2" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </p>
                </div>
              </div>
            </div>

            {/* Right side remains empty to let the background graphic show */}
            <div className="hidden lg:block flex-1" />
            
          </div>
        </div>
      </div>
    </section>
  );
}
