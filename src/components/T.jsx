"use client";

/* Translated text for SERVER components, which cannot call useTranslation():
     <h1><T k="web.landing.hero.title" /></h1>
   A client island that re-renders when the language changes. Text nodes only —
   for attributes (alt, aria-label), make the component a client component. */

import { useTranslation } from "react-i18next";

export function T({ k, vars }) {
  const { t } = useTranslation();
  return t(k, vars);
}
