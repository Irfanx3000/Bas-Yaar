import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { notificationService } from './notification.service';
import { navigationRef } from '../navigation/navigationRef';
import { notificationRefreshRef } from '../context/notificationRefreshRef';
import { ROUTES } from '../constants/routes.constants';

const CHANNEL_ID = 'default';

// Remembers the last token this device registered, so logout can deregister
// the exact same value without a second messaging().getToken() round trip.
let lastKnownToken = null;

export const setupNotifeeChannel = async () => {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'CrewApply Notifications',
    importance: AndroidImportance.HIGH,
  });
};

const navigateFromData = (data) => {
  if (!navigationRef.isReady()) return;
  if (data?.applicationId) {
    navigationRef.navigate(ROUTES.NOTIFICATIONS);
    return;
  }
  // The push only carries a jobId (not the full Job object JobDetailsScreen
  // expects as route.params.job), so this lands on the live, already-filtered
  // Job Alerts feed rather than a second fetch-then-navigate hop.
  if (data?.jobId) {
    navigationRef.navigate(ROUTES.JOB_ALERTS);
  }
};

// Plain FCM notification-only messages render nothing while the app is
// foregrounded — display it ourselves via notifee.
//
// smallIcon/color mirror AndroidManifest.xml's default_notification_icon/
// default_notification_color meta-data, which only covers notifications the
// OS displays itself (app backgrounded/killed) — this call is the
// foreground path, so it needs the same values set explicitly here.
// Without smallIcon, notifee falls back to the full-color app icon, which
// Android then forcibly alpha-masks into a muddy blob (small icons are
// always monochrome-only, a hard platform rule, not something either notifee
// or this app can opt out of).
export const displayForegroundNotification = async ({ title, body, data }) => {
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: CHANNEL_ID,
      pressAction: { id: 'default' },
      smallIcon: 'ic_notification',
      color: '#056DEC',
    },
  });
};

export const requestPermissionAndGetToken = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
    } else {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;
    }

    const token = await messaging().getToken();
    if (!token) return;
    lastKnownToken = token;
    await notificationService.registerDeviceToken(token, Platform.OS);
  } catch {
    // Permission denial or registration failure must never block the caller
    // (login/app boot) — push is a best-effort enhancement.
  }
};

export const deregisterCurrentDevice = async () => {
  try {
    const token = lastKnownToken || (await messaging().getToken().catch(() => null));
    // _skipSessionRecovery: this call runs *during* sign-out, when the access
    // token is typically already expired or absent. Without the flag its own
    // 401 would re-enter the API client's session-recovery branch, which would
    // call sign-out again, which would call this again — unbounded recursion.
    if (token) await notificationService.deregisterDeviceToken(token, { _skipSessionRecovery: true });
  } catch {
    // best-effort — logout must proceed regardless
  } finally {
    lastKnownToken = null;
  }
};

let listenersRegistered = false;

/**
 * Wires foreground display, tap-to-navigate, and token refresh. Safe to call
 * multiple times (e.g. app boot + post-login) — listeners are only attached once.
 */
export const initPush = async () => {
  await setupNotifeeChannel();

  if (listenersRegistered) return;
  listenersRegistered = true;

  messaging().onMessage(async (remoteMessage) => {
    const { notification, data } = remoteMessage;
    if (notification) {
      await displayForegroundNotification({ title: notification.title, body: notification.body, data });
    }
    // Bump the bell badge immediately instead of waiting for the next poll —
    // this is the real-time path; the poll in NotificationContext is the
    // fallback for whenever push isn't configured/delivered.
    notificationRefreshRef.current?.();
  });

  // Tapping a notification (from background or quit state) used to rely
  // entirely on the incidental AppState 'active' listener in
  // NotificationContext to catch the badge up — an indirect path with no
  // fallback of its own. Refreshing directly here means the badge is correct
  // the moment the app opens from the tap, not whenever/if that transition
  // happens to fire.
  messaging().onNotificationOpenedApp((remoteMessage) => {
    navigateFromData(remoteMessage?.data);
    notificationRefreshRef.current?.();
  });

  // App opened from a quit state by tapping a notification.
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        navigateFromData(remoteMessage.data);
        notificationRefreshRef.current?.();
      }
    });

  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      navigateFromData(detail.notification?.data);
      notificationRefreshRef.current?.();
    }
  });

  messaging().onTokenRefresh((token) => {
    lastKnownToken = token;
    notificationService.registerDeviceToken(token, Platform.OS).catch(() => {});
  });
};
