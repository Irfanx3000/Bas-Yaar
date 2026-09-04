import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// Prefer Google Play Services' fused provider on Android — it returns a fix far
// faster (and indoors) than the legacy LocationManager, which is what caused the
// "request timed out" errors.
try {
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
  });
} catch {
  // older lib versions may not support this — safe to ignore
}

// Ask for location permission at runtime. On iOS the prompt is triggered by the
// Geolocation call itself (backed by Info.plist), so we only gate Android here.
const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Allow location access',
        message:
          'CrewApply uses your location only to fill in your current city and state. ' +
          'You can always edit it manually.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

// Resolve the device's current coordinates.
// Two-stage: a fast COARSE (network/wifi) fix first — plenty for city/state — and
// only fall back to a high-accuracy GPS lock if the coarse attempt fails. A cached
// fix up to 5 min old is accepted so it can return instantly.
const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      () => {
        Geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 25000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });

// Reverse-geocode coordinates → { city, state, country } using BigDataCloud's
// free, key-less client endpoint (no API key or account required).
const reverseGeocode = async (latitude, longitude) => {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not look up your location.');
  const data = await res.json();
  const city = data.city || data.locality || '';
  const state = data.principalSubdivision || '';
  const country = data.countryName || '';
  return { city, state, country };
};

export const locationService = {
  /**
   * Full flow: permission → GPS position → reverse geocode.
   * @returns {Promise<{ city: string, state: string, country: string, label: string }>}
   *          `label` is a ready-to-use "City, State" string.
   * @throws  Error with .code === 'PERMISSION_DENIED' when the user declines.
   */
  detectCurrentLocation: async () => {
    const ok = await requestLocationPermission();
    if (!ok) {
      const err = new Error('Location permission denied.');
      err.code = 'PERMISSION_DENIED';
      throw err;
    }
    const { latitude, longitude } = await getCurrentPosition();
    const geo = await reverseGeocode(latitude, longitude);
    const label = [geo.city, geo.state].filter(Boolean).join(', ');
    return { ...geo, label };
  },
};
