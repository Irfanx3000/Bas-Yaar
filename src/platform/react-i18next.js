/* Web stand-in for react-i18next, backed by src/i18n. Same call shape as the
   app — `const { t } = useTranslation()` — and, like the real hook, the caller
   re-renders when the language changes and gets a NEW `t`, so a useMemo or
   useCallback that lists `t` as a dependency recomputes in the new language. */

import { useMemo } from "react";
import i18n, { useLanguageCode } from "../i18n";

export function useTranslation() {
  const language = useLanguageCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `language` IS the dependency: t reads it
  const t = useMemo(() => (key, vars) => i18n.t(key, vars), [language]);
  return { t, i18n, ready: true };
}

export const Trans = ({ children }) => children;
