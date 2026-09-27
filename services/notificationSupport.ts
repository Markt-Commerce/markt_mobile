/**
 * Whether the notification subsystem may load at all.
 *
 * Expo Go does not ship the native modules this feature needs: expo-background-task
 * is absent entirely (its `requireNativeModule('ExpoBackgroundTask')` throws at
 * import), and Android push was removed from Expo Go in SDK 53 (the token APIs
 * throw). So in Expo Go we skip notifications rather than crash — callers must
 * check this before importing ./notifications or ./backgroundTasks, and import
 * them dynamically so the native modules are never evaluated.
 *
 * This module imports nothing native on purpose: it must be safe to load anywhere.
 *
 * Set EXPO_PUBLIC_ENABLE_NOTIFICATIONS=1 to force it on (useful for testing local
 * notifications in Expo Go on iOS, where they still work), or =0 to force it off
 * in a dev build.
 */
import { isRunningInExpoGo } from "expo";

export function notificationsEnabled(): boolean {
  const override = process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS;
  if (override === "1") return true;
  if (override === "0") return false;
  return !isRunningInExpoGo();
}
