/**
 * Notification core: permissions, Android channels, the foreground handler,
 * Expo push-token registration, local scheduling, and the small AsyncStorage
 * state the background worker reads.
 *
 * Local notifications work in any dev/prod build. Remote push additionally
 * needs FCM configured (google-services.json + EAS credentials) — see
 * registerForPushToken.
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import logger from "../utils/logger";

// --- storage keys ------------------------------------------------------------
const K_LAST_OPEN = "notif.lastAppOpen";
const K_CART_COUNT = "notif.cartCount";
const K_PUSH_TOKEN = "notif.pushToken";
const K_SENT_PREFIX = "notif.sent.";

export type ReminderType = "reengagement" | "cart" | "gamification";

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
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) {
      logger.error("registerForPushToken: missing EAS projectId");
      return null;
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (data) await AsyncStorage.setItem(K_PUSH_TOKEN, data);
    return data ?? null;
  } catch (e) {
    // Common when FCM isn't set up yet — non-fatal for local reminders.
    logger.error("registerForPushToken failed:", e);
    return null;
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(K_PUSH_TOKEN);
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

// --- background-worker state -------------------------------------------------
export async function markAppOpened() {
  await AsyncStorage.setItem(K_LAST_OPEN, new Date().toISOString());
}

export async function getLastAppOpen(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(K_LAST_OPEN);
  return raw ? new Date(raw) : null;
}

/** The app caches its pending cart count so the worker needs no network. */
export async function setPendingCartCount(count: number) {
  await AsyncStorage.setItem(K_CART_COUNT, String(count));
}

export async function getPendingCartCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(K_CART_COUNT);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

/** True if a reminder of this type was already sent within `withinHours`. */
export async function sentRecently(
  type: ReminderType,
  withinHours: number
): Promise<boolean> {
  const raw = await AsyncStorage.getItem(K_SENT_PREFIX + type);
  if (!raw) return false;
  const last = new Date(raw).getTime();
  return Date.now() - last < withinHours * 3600_000;
}

export async function markSent(type: ReminderType) {
  await AsyncStorage.setItem(K_SENT_PREFIX + type, new Date().toISOString());
}

export function hoursSince(date: Date | null): number {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / 3600_000;
}
