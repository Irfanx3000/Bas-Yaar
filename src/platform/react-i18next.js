/* Web stand-in for react-i18next. The data layer uses useTranslation() in
   seven hooks; every one of them only ever destructures `t`. Backed by the
   English string table in src/i18n — see the note at the top of that file for
   why this is a string table and not internationalisation. */

import i18n from "../i18n";

export function useTranslation() {
  return { t: i18n.t, i18n, ready: true };
}

export const Trans = ({ children }) => children;
