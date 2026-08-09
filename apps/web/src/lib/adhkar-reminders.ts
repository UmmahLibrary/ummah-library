/**
 * Adhkar reminders — web wiring (ADR 0017/0019). The on/off preference goes
 * through the {@link webReminderStore} (`ReminderStore` port), the location and
 * cached timings through the {@link webPrayerSettingsStore} /
 * {@link webPrayerTimingsProvider}, and the scheduling decision is the shared
 * `syncAdhkarReminder` in `@ummahlibrary/core`. Delivery is the {@link Notifier}
 * port (fires while a tab is open); no server push.
 */
import type { AdhkarReminderOccasion, Coordinates, Notifier } from "@ummahlibrary/core";
import { syncAdhkarReminder as coreSyncAdhkarReminder } from "@ummahlibrary/core";
import { webPrayerSettingsStore } from "./prayer-settings-store";
import { webPrayerTimingsProvider } from "./prayer-timings-provider";
import { webReminderStore } from "./reminder-store";

/** Event dispatched on a preference change so the banner re-syncs. */
export const REMINDERS_KEY = "ul.adhkarReminders";

export const ADHKAR_LABEL: Record<AdhkarReminderOccasion, string> = {
  morning: "morning",
  evening: "evening",
};
export const ADHKAR_EMOJI: Record<AdhkarReminderOccasion, string> = {
  morning: "🌅",
  evening: "🌆",
};

export async function remindersEnabled(): Promise<boolean> {
  return (await webReminderStore.read()).adhkarOn;
}

export async function setRemindersEnabled(on: boolean): Promise<void> {
  await webReminderStore.writeAdhkarOn(on);
  window.dispatchEvent(new CustomEvent(REMINDERS_KEY, { detail: on }));
}

export async function readCoords(): Promise<Coordinates | null> {
  return (await webPrayerSettingsStore.read()).coords;
}

/** Today's prayer timings for the stored location, or `null` if none/failed. */
export function ensureTodaysTimings() {
  return webPrayerTimingsProvider.getTodaysTimings();
}

/** (Re)schedule the next adhkar notification through the shared orchestration. */
export function syncAdhkarReminder(notifier: Notifier): Promise<void> {
  return coreSyncAdhkarReminder({
    notifier,
    reminders: webReminderStore,
    timings: webPrayerTimingsProvider,
    now: () => new Date(),
  });
}
