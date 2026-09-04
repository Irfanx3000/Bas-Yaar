import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Adapts a backend Notification document into the flat shape the
// Notifications screen consumes.
export const mapNotificationFromApi = (n) => ({
  id: n._id,
  type: n.type,
  title: n.title,
  body: n.body,
  data: n.data || {},
  read: !!n.read,
  createdAt: n.createdAt,
});

// The mobile app only ever shows notifications actually addressed to the
// user themselves — admin-facing types (new application submitted, new
// subscription, new user registered) belong to the admin panel only, even
// for an account that happens to also hold the admin role. Comma-separated —
// the backend's parseCsvFilter turns this into a Mongo $in match.
const USER_FACING_TYPES = 'APPLICATION_STATUS_CHANGED,SUPPORT_INQUIRY_UPDATED,SUBSCRIPTION_EXPIRING';

export const notificationService = {
  getNotifications: async ({ page, limit } = {}) => {
    const { data } = await apiClient.get(ENDPOINTS.NOTIFICATIONS.LIST, {
      params: { page, limit, type: USER_FACING_TYPES },
    });
    return {
      notifications: (data.data.notifications || []).map(mapNotificationFromApi),
      pagination: data.meta?.pagination || { page: 1, limit: limit || 20, total: 0, totalPages: 1 },
    };
  },

  getUnreadCount: async () => {
    const { data } = await apiClient.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, {
      params: { type: USER_FACING_TYPES },
    });
    return data.data.count;
  },

  markAsRead: (id) => apiClient.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),

  markAllAsRead: () => apiClient.post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ),

  registerDeviceToken: (token, platform) =>
    apiClient.post(ENDPOINTS.NOTIFICATIONS.DEVICE_TOKEN, { token, platform }),

  // `config` lets the caller pass axios options through — notably
  // `_skipSessionRecovery: true`, which push.service sets because this call is
  // itself part of the sign-out path and must never be able to re-enter the
  // API client's 401 handler (see the note at the top of api/client.js).
  deregisterDeviceToken: (token, config) =>
    apiClient.delete(ENDPOINTS.NOTIFICATIONS.DEVICE_TOKEN, { data: { token }, ...config }),

  getNotificationSettings: async () => {
    const { data } = await apiClient.get(ENDPOINTS.NOTIFICATIONS.SETTINGS);
    return {
      notificationExpiryDays: data.data.notificationExpiryDays,
      pushNotificationsEnabled: data.data.pushNotificationsEnabled,
    };
  },

  updateNotificationSettings: async ({ notificationExpiryDays, pushNotificationsEnabled }) => {
    const { data } = await apiClient.patch(ENDPOINTS.NOTIFICATIONS.SETTINGS, {
      notificationExpiryDays,
      pushNotificationsEnabled,
    });
    return {
      notificationExpiryDays: data.data.notificationExpiryDays,
      pushNotificationsEnabled: data.data.pushNotificationsEnabled,
    };
  },
};
