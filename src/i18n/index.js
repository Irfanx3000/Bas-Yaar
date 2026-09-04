/* English string table. This is NOT internationalisation.

   The web build ships one language. But the copied data layer calls t() in 66
   places across 16 files, and the strings themselves only exist inside the
   app's translation.json. Editing all 66 call sites would mean re-editing them
   every time a service is re-copied from the app, and would scatter user-facing
   copy through the service layer.

   So: keep the tiny t() contract, drop i18next entirely. No locale detection,
   no language switcher, no /[lang]/ routes, no second translation file. Just a
   lookup into the English copy deck, ~30 lines instead of a dependency.

   If a second language is ever wanted, this is where it stops being enough —
   see the note in PROGRESS.md, it is a restructure rather than an addition. */

import en from "./locales/en/translation.json";

const lookup = (key) =>
  String(key)
    .split(".")
    .reduce((node, part) => (node == null ? undefined : node[part]), en);

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
    const suffix = vars.count === 1 ? "_one" : "_other";
    const plural = lookup(key + suffix) ?? lookup(key + "_plural");
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

const i18n = { t, exists, language: "en", languages: ["en"] };

export default i18n;
