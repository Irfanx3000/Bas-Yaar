/* Web stand-in for React Navigation's global navigation ref.

   api/client.js reaches for this from outside React — when a refresh fails or
   an account is blocked mid-session, its axios interceptor tears the session
   down and sends the user back to the auth stack. It calls exactly two methods,
   isReady() and reset(), so those are what this provides.

   The Next router is injected once by the (app) layout via setRouter(); until
   that happens isReady() is false and the interceptor skips the redirect,
   which is the same contract React Navigation has before the container mounts. */

let router = null;

/** Called once from the (app) route group's client layout. */
export const setRouter = (nextRouter) => {
  router = nextRouter;
};

/* React Navigation route names → web paths. Only the ones the interceptor
   actually resets to need to be here. */
const PATHS = { Auth: "/login", MainTabs: "/dashboard" };

export const navigationRef = {
  isReady: () => router !== null,

  /** reset({ index, routes }) — the last route in the list is the destination. */
  reset: ({ routes } = {}) => {
    const target = routes?.[routes.length - 1]?.name;
    // replace(), not push(): a dead session must not be reachable with Back.
    router?.replace(PATHS[target] ?? "/");
  },

  navigate: (name) => router?.push(PATHS[name] ?? "/"),
};
