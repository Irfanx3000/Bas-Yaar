"use client";

/* Language — the app's sidebar "Language" screen. */

import { useTranslation } from "react-i18next";
import { LanguageList } from "@/components/LanguageList";

export default function LanguagePage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-5">
        <h1 className="text-h2 font-extrabold text-heading">{t("language.title")}</h1>
        <p className="mt-1 text-md text-body">{t("language.subtitle")}</p>
      </header>
      <LanguageList />
    </div>
  );
}
