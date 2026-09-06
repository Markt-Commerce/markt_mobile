/**
 * Initializes notifications on app start: foreground handler, Android channels,
 * permission request, the background reminder worker, and (when logged in)
 * Expo push-token registration with the backend. Renders nothing.
 *
 * Mounted once inside the provider tree in app/_layout.tsx.
 *
 * Every notification module is imported *dynamically*, gated on
 * notificationsEnabled(). Static imports would pull in expo-background-task and
 * expo-notifications, both of which resolve native modules at module scope and
 * throw in Expo Go — crashing the app before this component could opt out. Only
 * ./notificationState (plain AsyncStorage) is safe to import statically.
 */
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { router } from "expo-router";
import type { EventSubscription } from "expo-modules-core";

import { useUser } from "../hooks/userContextProvider";
import { markAppOpened } from "../services/notificationState";
import { notificationsEnabled } from "../services/notificationSupport";
import { resolveNotificationRoute } from "../utils/notificationDeepLink";
import { emitNotificationsChanged } from "../utils/notificationEvents";
import logger from "../utils/logger";

export default function NotificationsBootstrap() {
  const { user } = useUser();
  const enabled = notificationsEnabled();

  // One-time device setup.
  useEffect(() => {
    // The worker's re-engagement rule reads this, so keep it current even when
    // notifications themselves are unavailable.
    markAppOpened();

    const appStateSub = AppState.addEventListener("change", (s) => {
      if (s === "active") markAppOpened();
    });

    if (!enabled) {
      logger.info("notifications disabled in this environment (Expo Go?)");
      return () => appStateSub.remove();
    }

    let responseSub: EventSubscription | undefined;
    let receivedSub: EventSubscription | undefined;
    let cancelled = false;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        const { configureHandler, ensureAndroidChannels, requestPermissions } =
          await import("../services/notifications");
        const { registerBackgroundReminders } = await import(
          "../services/backgroundTasks"
        );

        if (cancelled) return;

        configureHandler();
        await ensureAndroidChannels();
        await requestPermissions();
        await registerBackgroundReminders();

        if (cancelled) return;

        // A push arriving while the app is foregrounded still means a new,
        // unread row exists server-side -- bump the bell badge without
        // waiting for the user to reopen the Alerts screen.
        receivedSub = Notifications.addNotificationReceivedListener(() => {
          emitNotificationsChanged();
        });

        responseSub = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data as
              | Record<string, unknown>
              | undefined;
            if (!data) return;
            const route = resolveNotificationRoute({
              type: data.type as string | undefined,
              reference_type: data.reference_type as string | undefined,
              reference_id: data.reference_id as string | undefined,
            });
            if (route) router.push(route as any);
          }
        );
      } catch (e) {
        logger.error("notification setup failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      responseSub?.remove();
      receivedSub?.remove();
      appStateSub.remove();
    };
  }, [enabled]);

  // Register the push token once we know who the user is.
  useEffect(() => {
    if (!enabled || !user?.user_id) return;
    (async () => {
      try {
        const { registerForPushToken } = await import(
          "../services/notifications"
        );
        const { registerPushToken } = await import("../services/sections/push");
        const token = await registerForPushToken();
        if (token) await registerPushToken(token, Platform.OS);
      } catch (e) {
        logger.error("push token registration failed:", e);
      }
    })();
  }, [enabled, user?.user_id]);

  return null;
}
