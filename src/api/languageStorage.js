import AsyncStorage from '@react-native-async-storage/async-storage';

// Matches the @crewapply: namespacing convention used by tokenStorage.js.
const KEY = '@crewapply:language';

export const languageStorage = {
  get: () => AsyncStorage.getItem(KEY),
  set: (code) => AsyncStorage.setItem(KEY, code),
  clear: () => AsyncStorage.removeItem(KEY),
};
