/* Web stand-in for @react-native-community/geolocation.
   navigator.geolocation is the same callback shape, so this is a pass-through
   that also fails cleanly when the API is missing (insecure origin, or a
   browser with it disabled) instead of throwing on a missing global. */

const Geolocation = {
  getCurrentPosition(onSuccess, onError, options) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onError?.({ code: 2, message: "Geolocation unavailable in this browser." });
      return;
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  },
  requestAuthorization() {
    /* The browser prompts at the point of use, so there is nothing to request
       up front. Kept so the call site resolves. */
  },
};

export default Geolocation;
