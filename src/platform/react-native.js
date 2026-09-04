/* Web stand-in for the `react-native` module.

   Aliased in next.config.mjs, so the ~7,200 lines of copied data layer keep
   importing `from 'react-native'` unchanged and re-copying from the app later
   stays a plain file copy with no re-editing.

   Only what the data layer actually imports is here — Platform, AppState and
   PermissionsAndroid. Animated, Dimensions, DevSettings and I18nManager were
   used solely by SidebarContext and LanguageContext, both of which the web
   build drops (the sidebar is rebuilt natively; there is one language).
   Add to this file only when a real import needs it. */

/* Every Platform branch in the copied services is an `OS === 'android'` guard
   around a runtime permission request, so 'web' falls through to the correct
   path in all seven call sites with no special-casing:
     location.service  → permission assumed, the browser prompts on its own
     permissions.js    → same
     push.service      → returns early, push is not wired up on web yet
     pdf.service       → skips the Android download-manager branch */
export const Platform = {
  OS: "web",
  Version: 0,
  select: (spec) => spec.web ?? spec.default ?? spec.native,
};

/* AppState → the Page Visibility API. dataSync uses this to decide when cached
   server state has gone stale (a backgrounded tab misses everything an admin
   changed), and connectivity uses it to re-probe on return. `active`/
   `background` are the only two states the copied code tests for. */
export const AppState = {
  get currentState() {
    if (typeof document === "undefined") return "active";
    return document.visibilityState === "visible" ? "active" : "background";
  },
  addEventListener(type, handler) {
    if (type !== "change" || typeof document === "undefined") {
      return { remove() {} };
    }
    const onVisibilityChange = () =>
      handler(document.visibilityState === "visible" ? "active" : "background");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return {
      remove: () =>
        document.removeEventListener("visibilitychange", onVisibilityChange),
    };
  },
};

/* Android runtime permissions have no web equivalent — the browser prompts at
   the point of use (geolocation, notifications) rather than up front. Every
   caller is already behind an `OS === 'android'` check, so nothing here is
   reached; it exists so the imports resolve. PERMISSIONS returns the key name
   for any lookup, which is what the Android constants are anyway. */
export const PermissionsAndroid = {
  PERMISSIONS: new Proxy({}, { get: (_target, key) => String(key) }),
  RESULTS: {
    GRANTED: "granted",
    DENIED: "denied",
    NEVER_ASK_AGAIN: "never_ask_again",
  },
  request: async () => "granted",
  check: async () => true,
};
