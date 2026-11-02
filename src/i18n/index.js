/* The app's i18n, without i18next.

   The app runs i18next + react-i18next. The web keeps the same contract —
   t(key, vars), i18n.language, useTranslation() from "react-i18next" (aliased
   to src/platform/react-i18next.js) — over the app's own translation.json
   files, copied verbatim into ./locales. A screen ported from the app keeps its
   t() calls unchanged.

   What i18next did that this file does, in ~60 lines:
     · lookup with English fallback — hi is missing ~200 of the app's keys and
       i18next's fallbackLng shows English for those, so this does too
     · {{var}} interpolation and _one/_other plurals
     · a current language that is saved (same @crewapply:language key as the
       app) and that components re-render on — see useLanguageCode below

   Locales: the app's LANGUAGES list, same ids and flags. Only en and hi have
   translations; the rest are listed as "coming soon", exactly as in the app.
   ponytail: only en/hi are bundled — copy a locale file in and import it here
   when its comingSoon flag comes off. */

import { useEffect, useSyncExternalStore } from "react";
import { languageStorage } from "../api/languageStorage";
import enApp from "./locales/en/translation.json";
import hiApp from "./locales/hi/translation.json";
import hiAppFill from "./locales/hi/app-fill.json";
import enLanding from "./locales/en/web/landing.json";
import enAuth from "./locales/en/web/auth.json";
import enJobs from "./locales/en/web/jobs.json";
import enProfile from "./locales/en/web/profile.json";
import enAccount from "./locales/en/web/account.json";
import enUi from "./locales/en/web/ui.json";
import hiLanding from "./locales/hi/web/landing.json";
import hiAuth from "./locales/hi/web/auth.json";
import hiJobs from "./locales/hi/web/jobs.json";
import hiProfile from "./locales/hi/web/profile.json";
import hiAccount from "./locales/hi/web/account.json";
import hiUi from "./locales/hi/web/ui.json";

/* locales/<lang>/translation.json are verbatim copies of the app's files — keep
   them that way so they can be re-copied. Web-only copy lives under `web.*`,
   one file per area; hi/app-fill.json supplies the app keys hi.json lacks. */
const deepMerge = (base, extra) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) ? deepMerge(base?.[k] ?? {}, v) : v;
  }
  return out;
};

const en = {
  ...enApp,
  web: { landing: enLanding, auth: enAuth, jobs: enJobs, profile: enProfile, account: enAccount, ui: enUi },
};
const hi = {
  ...deepMerge(hiApp, hiAppFill),
  web: { landing: hiLanding, auth: hiAuth, jobs: hiJobs, profile: hiProfile, account: hiAccount, ui: hiUi },
};

const RESOURCES = { en, hi };

/* The app's src/i18n/languages.js. */
export const LANGUAGES = [
  { id: "en", name: "English", nativeName: "English", badge: "En" },
  { id: "hi", name: "Hindi", nativeName: "हिंदी", badge: "अ" },
  { id: "de", name: "German", nativeName: "Deutsch", badge: "De", comingSoon: true },
  { id: "fil", name: "Filipino", nativeName: "Tagalog", badge: "Ph", comingSoon: true },
  { id: "es", name: "Spanish", nativeName: "Español", badge: "Es", comingSoon: true },
  { id: "ar", name: "Arabic", nativeName: "العربية", badge: "ع", comingSoon: true },
  { id: "zh", name: "Chinese", nativeName: "中文", badge: "中", comingSoon: true },
];
export const DEFAULT_LANGUAGE = "en";

let current = DEFAULT_LANGUAGE;
const listeners = new Set();

const lookupIn = (table, key) =>
  String(key)
    .split(".")
    .reduce((node, part) => (node == null ? undefined : node[part]), table);

const lookup = (key) => {
  const value = lookupIn(RESOURCES[current], key);
  return typeof value === "string" || current === DEFAULT_LANGUAGE ? value : lookupIn(en, key);
};

/* i18next's interpolation syntax, which is what the copy deck is written in. */
const interpolate = (template, vars) =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
    vars[name] === undefined || vars[name] === null ? match : String(vars[name]),
  );

/**
 * @param {string} key   dotted path into translation.json, e.g. 'common.ok'
 * @param {object} [vars] interpolation values; `count` also selects a plural
 *                        form, and `defaultValue` is used if the key is missing
 */
export const t = (key, vars) => {
  let value = lookup(key);

  // i18next plural suffixes, in the order it resolves them.
  if (vars && typeof vars.count === "number") {
    // v3 files (the app's) have only `_plural`, which is the NON-singular form.
    const plural = vars.count === 1 ? lookup(key + "_one") : lookup(key + "_other") ?? lookup(key + "_plural");
    if (typeof plural === "string") value = plural;
  }

  if (typeof value !== "string") {
    // Match i18next: a missing key renders as the key, so it is obvious on
    // screen rather than silently blank.
    return vars?.defaultValue ?? String(key);
  }

  return vars ? interpolate(value, vars) : value;
};

/** Does a key resolve to a real string? getErrorMessage uses this to decide
 *  whether a server error code has copy of its own before falling back. */
export const exists = (key) => typeof lookup(key) === "string";

const apply = (code) => {
  if (!RESOURCES[code] || code === current) return;
  current = code;
  if (typeof document !== "undefined") document.documentElement.lang = code;
  listeners.forEach((notify) => notify());
};

/** The app's LanguageContext.setLanguage: switch, persist, re-render. */
export const changeLanguage = async (code) => {
  apply(code);
  await languageStorage.set(code).catch(() => {});
};

const subscribe = (notify) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

/* Restore the saved choice, as the app's LanguageProvider does on boot.
   From an EFFECT, never at import: the server renders English (it has no
   storage), so switching before hydration would make t() disagree with the
   server HTML. Effects run after hydration; subscribers then re-render. */
let restored = false;
const restoreSaved = () => {
  if (restored) return;
  restored = true;
  languageStorage.get().then((saved) => saved && apply(saved)).catch(() => {});
};

/** Current language code; re-renders the caller when it changes. */
export const useLanguageCode = () => {
  useEffect(restoreSaved, []);
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT_LANGUAGE);
};

const i18n = {
  t,
  exists,
  changeLanguage,
  get language() {
    return current;
  },
  languages: Object.keys(RESOURCES),
};

export default i18n;
