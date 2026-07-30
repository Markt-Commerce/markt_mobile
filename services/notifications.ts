/**
 * Notification core: permissions, Android channels, the foreground handler,
 * Expo push-token registration, local scheduling, and the small AsyncStorage
 * state the background worker reads.
 *
 * Local notifications work in any dev/prod build. Remote push additionally
 * needs FCM configured (google-services.json + EAS credentials) — see
 * registerForPushToken.
 *
 * Importing this module pulls in expo-notifications, which throws at load time
 * in Expo Go. Import from ./notificationState instead if you only need the
 * stored state (token, cart count, timestamps) — those are re-exported below.
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import logger from "../utils/logger";
import { setStoredPushToken } from "./notificationState";
import { notificationsEnabled } from "./notificationSupport";

export * from "./notificationState";

export const ANDROID_CHANNEL_DEFAULT = "default";
export const ANDROID_CHANNEL_REMINDERS = "reminders";

/** How foreground notifications behave (SDK 53+ banner/list fields). */
export function configureHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Android requires channels; create them once. No-op on iOS. */
export async function ensureAndroidChannels() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_DEFAULT, {
      name: "General",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_REMINDERS, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#E94C2A",
    });
  } catch (e) {
    logger.error("ensureAndroidChannels failed:", e);
  }
}

/** Ask for notification permission. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    return status === "granted";
  } catch (e) {
    logger.error("requestPermissions failed:", e);
    return false;
  }
}

/**
 * Register for an Expo push token (remote push). Requires a physical device and,
 * on Android, FCM configured for the EAS project. Returns the token string or
 * null. The caller sends it to the backend.
 */
export async function registerForPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    // On Android in Expo Go this call throws outright rather than failing soft.
    if (!notificationsEnabled()) {
      logger.info("registerForPushToken: skipped (push unavailable here)");
      return null;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) {
      logger.error("registerForPushToken: missing EAS projectId");
      return null;
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (data) await setStoredPushToken(data);
    return data ?? null;
  } catch (e) {
    // Common when FCM isn't set up yet — non-fatal for local reminders.
    logger.error("registerForPushToken failed:", e);
    return null;
  }
}

/** Fire a local notification immediately (used by the background worker). */
export async function scheduleReminder(
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        ...(Platform.OS === "android"
          ? { channelId: ANDROID_CHANNEL_REMINDERS }
          : {}),
      },
      trigger: null, // deliver now
    });
  } catch (e) {
    logger.error("scheduleReminder failed:", e);
  }
}
