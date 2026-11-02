"use client";

/* The app's LanguageScreen list: English under "Recommended", the rest under
   "All Languages", radio on the right, "Coming Soon" pill + info alert for the
   languages without translations. Picking one switches the whole site at once
   and saves it — i18n.changeLanguage is the app's LanguageContext.setLanguage.

   Shared by the last step of signup and the /language page. */

import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { showAlert } from "@/utils/alertRef";

export function LanguageList() {
  const { t, i18n } = useTranslation();

  const choose = (item) => {
    if (item.comingSoon) {
      showAlert({
        type: "info",
        title: t("language.comingSoonAlertTitle"),
        message: t("language.comingSoonAlertBody", { language: item.name }),
      });
      return;
    }
    i18n.changeLanguage(item.id);
  };

  const row = (item) => {
    const selected = i18n.language === item.id;
    return (
      <button
        key={item.id}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-disabled={item.comingSoon || undefined}
        lang={item.id}
        onClick={() => choose(item)}
        className={`mb-3 flex w-full cursor-pointer items-center justify-between gap-3 rounded-[16px] border p-4 text-left shadow-sm transition-colors duration-[180ms] ease-standard ${
          selected ? "border-primary/30 bg-primary-tint" : "border-line-soft bg-surface hover:border-primary/40"
        } ${item.comingSoon ? "opacity-60" : ""}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-md text-md font-bold ${
              selected ? "bg-surface text-primary" : "bg-canvas-top text-heading"
            }`}
          >
            {item.badge}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-md font-semibold text-heading">{item.nativeName}</span>
            <span lang="en" className="mt-[2px] block truncate text-sm font-medium text-body">
              {item.name}
            </span>
          </span>
        </span>

        {item.comingSoon ? (
          <span className="shrink-0 rounded-round bg-canvas-top px-2.5 py-1 text-xs font-bold text-body">
            {t("language.comingSoon")}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={`flex size-5 shrink-0 items-center justify-center rounded-round border-[1.5px] ${
              selected ? "border-primary" : "border-hint"
            }`}
          >
            {selected ? <span className="size-[11px] rounded-round bg-primary" /> : null}
          </span>
        )}
      </button>
    );
  };

  return (
    <div role="radiogroup" aria-label={t("language.title")}>
      <h2 className="mb-3 text-md font-bold text-primary">{t("language.recommended")}</h2>
      {LANGUAGES.filter((l) => l.id === "en").map(row)}

      <h2 className="mt-5 mb-3 text-md font-bold text-heading">{t("language.all")}</h2>
      {LANGUAGES.filter((l) => l.id !== "en").map(row)}
    </div>
  );
}
