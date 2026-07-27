/**
 * Initializes notifications on app start: foreground handler, Android channels,
 * permission request, the background reminder worker, and (when logged in)
 * Expo push-token registration with the backend. Renders nothing.
 *
 * Mounted once inside the provider tree in app/_layout.tsx.
 */
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { useUser } from "../hooks/userContextProvider";
import {
  configureHandler,
  ensureAndroidChannels,
  requestPermissions,
  registerForPushToken,
  markAppOpened,
} from "../services/notifications";
import { registerBackgroundReminders } from "../services/backgroundTasks";
import { registerPushToken } from "../services/sections/push";
import logger from "../utils/logger";

export default function NotificationsBootstrap() {
  const { user } = useUser();

  // One-time device setup.
  useEffect(() => {
    configureHandler();
    let responseSub: Notifications.Subscription | undefined;

    (async () => {
      await ensureAndroidChannels();
      await markAppOpened();
      await requestPermissions();
      await registerBackgroundReminders();
    })();

    // Tapping a reminder opens the app; deep-linking by data.type can be added
    // here later.
    responseSub = Notifications.addNotificationResponseReceivedListener(() => {});

    // Refresh the "last opened" timestamp the worker uses for re-engagement.
    const appStateSub = AppState.addEventListener("change", (s) => {
      if (s === "active") markAppOpened();
    });

    return () => {
      responseSub?.remove();
      appStateSub.remove();
    };
  }, []);

  // Register the push token once we know who the user is.
  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      try {
        const token = await registerForPushToken();
        if (token) await registerPushToken(token, Platform.OS);
      } catch (e) {
        logger.error("push token registration failed:", e);
      }
    })();
  }, [user?.user_id]);

  return null;
}
