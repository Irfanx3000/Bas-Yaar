// Global ref so code outside NotificationProvider (e.g. push.service.js's
// foreground message handler, which isn't a React component) can trigger an
// immediate unread-count refresh the instant a push arrives — mirrors the
// navigationRef pattern used for the same "reach into the tree from outside" need.
export const notificationRefreshRef = { current: null };
