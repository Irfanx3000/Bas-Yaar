/* Web stand-in for @react-native-async-storage/async-storage.

   The API stays PROMISE-BASED even though localStorage is synchronous —
   tokenStorage and languageStorage await every call, and the axios request
   interceptor awaits getAccessToken() on every single request. Returning raw
   values here would break both.

   localStorage can throw rather than merely return null: Safari private mode,
   a browser set to block site data, or a storage quota that is already full.
   An exception on the token read would reject every request in the app, so
   each access is guarded and falls back to an in-memory map — the session then
   lasts until the tab closes instead of failing outright. The same map serves
   as the SSR fallback, where `window` does not exist at all. */

const memory = new Map();

const local = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null; // storage access denied by policy
  }
};

const AsyncStorage = {
  getItem: async (key) => {
    const store = local();
    if (!store) return memory.has(key) ? memory.get(key) : null;
    try {
      return store.getItem(key);
    } catch {
      return memory.has(key) ? memory.get(key) : null;
    }
  },

  setItem: async (key, value) => {
    memory.set(key, value);
    try {
      local()?.setItem(key, value);
    } catch {
      /* quota exceeded or storage blocked — the memory copy above still holds */
    }
  },

  removeItem: async (key) => {
    memory.delete(key);
    try {
      local()?.removeItem(key);
    } catch {
      /* nothing to do — the memory copy is already gone */
    }
  },
};

export default AsyncStorage;
