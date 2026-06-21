/**
 * Mobile adapter for the core {@link Notifier} port, backed by expo-notifications.
 *
 * Unlike the web adapter (in-page timers that fire only while a tab is open), the
 * OS scheduler delivers these even when the app is closed — the point of #71. The
 * decision of what-and-when stays in `core` (`reminders.ts`): each notification is
 * a one-shot at its `at`, and the app re-syncs on foreground (AppState) to roll
 * the schedule to the next day. Cancellation is by id, matching the core
 * orchestration, so one notifier serves every reminder family.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { AppNotification, Notifier, NotifyPermission } from "@ummahlibrary/core";

const CHANNEL_ID = "reminders";

// permission() is synchronous in the port, but expo's lookup is async — cache the
// last-known status, refreshed by initNotifier()/requestPermission().
let cachedPermission: NotifyPermission = "default";

function mapStatus(status: string): NotifyPermission {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "default";
}

// Show reminders as a banner even while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Prime the Android channel and the cached permission. Call once on app start. */
export async function initNotifier(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  try {
    cachedPermission = mapStatus((await Notifications.getPermissionsAsync()).status);
  } catch {
    /* leave the default */
  }
}

export const expoNotifier: Notifier = {
  isSupported: () => true,
  permission: () => cachedPermission,
  requestPermission: async () => {
    try {
      cachedPermission = mapStatus((await Notifications.requestPermissionsAsync()).status);
    } catch {
      /* keep the cached value */
    }
    return cachedPermission;
  },
  schedule: async (n: AppNotification) => {
    await Notifications.cancelScheduledNotificationAsync(n.id).catch(() => {});
    if (cachedPermission !== "granted") return;
    const at = n.at ? new Date(n.at) : null;
    const trigger =
      at && at.getTime() > Date.now()
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            channelId: CHANNEL_ID,
          }
        : null;
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body },
      trigger,
    });
  },
  cancel: async (id) => {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  },
  cancelAll: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
