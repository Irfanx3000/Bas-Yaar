/* Stub for @notifee/react-native — the in-app display half of push.

   ponytail: no-op, paired with platform/messaging.js. Nothing can arrive to be
   displayed while messaging is stubbed, so these only need to resolve. When web
   push lands in Phase 6, displayNotification becomes the Notification API. */

const notifee = {
  createChannel: async () => "default",
  displayNotification: async () => {},
  cancelAllNotifications: async () => {},
  onForegroundEvent: () => () => {},
  onBackgroundEvent: () => {},
  getInitialNotification: async () => null,
  setBadgeCount: async () => {},
};

export const AndroidImportance = { HIGH: 4, DEFAULT: 3, LOW: 2 };
export const EventType = { DISMISSED: 0, PRESS: 1, DELIVERED: 3 };

export default notifee;
