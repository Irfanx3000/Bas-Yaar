/* Stub for @react-native-firebase/messaging.

   ponytail: no-op, not web-push. push.service.js is on the LOGIN path
   (auth.service calls requestPermissionAndGetToken after a successful sign-in),
   so this has to resolve rather than throw or login breaks.

   Every real call in push.service is already behind `Platform.OS !== 'android'`
   and returns early on web, so these are reached only defensively. Web push
   (FCM via a service worker, or the Push API directly) is Phase 6 — until then
   the web simply does not register a device token, which is correct: it has no
   token to register. */

const noopSubscription = () => () => {};

const messaging = () => ({
  requestPermission: async () => 0, // AuthorizationStatus.DENIED
  getToken: async () => null,
  deleteToken: async () => {},
  onMessage: noopSubscription,
  onNotificationOpenedApp: noopSubscription,
  onTokenRefresh: noopSubscription,
  getInitialNotification: async () => null,
  setBackgroundMessageHandler: () => {},
});

messaging.AuthorizationStatus = { DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 };

export default messaging;
