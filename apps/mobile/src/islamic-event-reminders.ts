/**
 * Islamic-event reminders — mobile wiring (#143). Per-event on/off toggles go
 * through the {@link mobileReminderStore}; the scheduling decision is the shared
 * `syncIslamicEventReminders` in `@ummahlibrary/core`; delivery is the
 * {@link expoNotifier} (OS-scheduled). Reuses the same orchestration as the web.
 */
import { syncIslamicEventReminders as coreSyncIslamicEventReminders } from "@ummahlibrary/core";
import { expoNotifier } from "./notifier";
import { mobileReminderStore } from "./reminder-store";

export async function readEventReminders(): Promise<Record<string, boolean>> {
  return (await mobileReminderStore.read()).islamicEvents;
}

/** Toggle one event's reminder, persisting the updated map (off = removed) and re-syncing. */
export async function setEventReminder(eventId: string, on: boolean): Promise<Record<string, boolean>> {
  const prefs = { ...(await readEventReminders()) };
  if (on) prefs[eventId] = true;
  else delete prefs[eventId];
  await mobileReminderStore.writeIslamicEvents(prefs);
  await syncIslamicEventReminders();
  return prefs;
}

export function syncIslamicEventReminders(): Promise<void> {
  return coreSyncIslamicEventReminders({
    notifier: expoNotifier,
    reminders: mobileReminderStore,
    now: () => new Date(),
  });
}
