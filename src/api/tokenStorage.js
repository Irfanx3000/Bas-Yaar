import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@crewapply:access_token',
  REFRESH_TOKEN: '@crewapply:refresh_token',
  USER: '@crewapply:user',
};

export const tokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(KEYS.ACCESS_TOKEN),

  setAccessToken: (token) => AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token),

  getRefreshToken: () => AsyncStorage.getItem(KEYS.REFRESH_TOKEN),

  setRefreshToken: (token) => AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token),

  getUser: async () => {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  setUser: (user) => AsyncStorage.setItem(KEYS.USER, JSON.stringify(user)),

  // Use individual removeItem calls (present in every AsyncStorage version) —
  // this build (v3.x) renamed the batch API (multiRemove → removeMany), so
  // calling AsyncStorage.multiRemove here threw "undefined is not a function".
  clearAll: () => Promise.all(Object.values(KEYS).map((k) => AsyncStorage.removeItem(k))),
};
