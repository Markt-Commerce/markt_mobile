/**
 * Background worker that periodically decides whether to fire a local reminder
 * (spec: "a background worker that adds notifications and reminders sometimes").
 *
 * Runs at the OS's discretion (expo-background-task / WorkManager). The logic is
 * deliberately network-free — it reads only the small state the app caches
 * (last-open time, pending cart count) so it's reliable even offline. At most
 * one reminder per run, each type rate-limited, highest priority first.
 */
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import logger from "../utils/logger";
import {
  getLastAppOpen,
  getPendingCartCount,
  scheduleReminder,
  sentRecently,
  markSent,
  hoursSince,
} from "./notifications";

export const BACKGROUND_REMINDER_TASK = "markt-background-reminders";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Evaluate reminder rules and fire at most one. Exported for foreground testing. */
export async function runReminderChecks(): Promise<void> {
  const lastOpen = await getLastAppOpen();
  const sinceOpen = hoursSince(lastOpen);

  // 1. Strong re-engagement when away for 2+ days.
  if (sinceOpen >= 48 && !(await sentRecently("reengagement", 48))) {
    await scheduleReminder(
      "We miss you at Markt 👀",
      "See what's new in your feed and niches.",
      { type: "reengagement" }
    );
    await markSent("reengagement");
    return;
  }

  // 2. Abandoned cart.
  const cart = await getPendingCartCount();
  if (cart > 0 && !(await sentRecently("cart", 24))) {
    await scheduleReminder(
      "Your cart is waiting 🛒",
      cart === 1
        ? "You left an item in your cart — check out before it's gone."
        : `You left ${cart} items in your cart — check out before they're gone.`,
      { type: "cart" }
    );
    await markSent("cart");
    return;
  }

  // 3. Daily streak nudge if the app wasn't opened today.
  if (
    lastOpen &&
    !isSameDay(lastOpen, new Date()) &&
    !(await sentRecently("gamification", 20))
  ) {
    await scheduleReminder(
      "Keep your streak alive 🌟",
      "Open Markt today to earn your daily points.",
      { type: "gamification" }
    );
    await markSent("gamification");
    return;
  }
}

// Define the task at module scope so it's registered whenever this module is
// loaded — including the headless JS load when the OS wakes the app.
TaskManager.defineTask(BACKGROUND_REMINDER_TASK, async () => {
  try {
    await runReminderChecks();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    logger.error("background reminder task failed:", e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Register the periodic worker (idempotent). Interval is in minutes. */
export async function registerBackgroundReminders(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      logger.error("background tasks restricted on this device");
      return;
    }
    const registered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_REMINDER_TASK
    );
    if (!registered) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_REMINDER_TASK, {
        minimumInterval: 360, // ~6 hours; OS decides actual cadence
      });
    }
  } catch (e) {
    logger.error("registerBackgroundReminders failed:", e);
  }
}

export async function unregisterBackgroundReminders(): Promise<void> {
  try {
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_REMINDER_TASK)) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_REMINDER_TASK);
    }
  } catch (e) {
    logger.error("unregisterBackgroundReminders failed:", e);
  }
}
