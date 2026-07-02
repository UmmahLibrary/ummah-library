/**
 * Mobile `ReminderStore` adapter (ADR 0024): the reader's reminder preferences
 * in AsyncStorage under the same `ul.*` keys the web uses, so both clients
 * describe the same local-first state. Persistence only — the reminder
 * orchestration lives in `@ummahlibrary/core`. Mirrors the web adapter.
 */
import {
  DEFAULT_PLAN_REMINDER_TIME,
  type PlanReminderPref,
  type PrayerName,
  type ReminderPrefs,
  type ReminderStore,
} from "@ummahlibrary/core";
import { KEYS, getJSON, getString, isObjectRecord, setJSON, setString } from "./storage";

export const mobileReminderStore: ReminderStore = {
  read: async (): Promise<ReminderPrefs> => {
    // Object guards: a corrupt/peer-synced null would crash on `plan.on` / `prayers[p]`.
    const [plan, prayers, adhkar, sunnahFast, islamicEvents] = await Promise.all([
      getJSON<PlanReminderPref>(
        KEYS.planReminder,
        { on: false, time: DEFAULT_PLAN_REMINDER_TIME },
        isObjectRecord,
      ),
      getJSON<Partial<Record<PrayerName, boolean>>>(KEYS.prayerReminders, {}, isObjectRecord),
      getString(KEYS.adhkarReminders),
      getString(KEYS.sunnahFastReminders),
      getJSON<Record<string, boolean>>(KEYS.islamicEventReminders, {}, isObjectRecord),
    ]);
    return {
      plan: {
        on: plan.on === true,
        time: typeof plan.time === "string" ? plan.time : DEFAULT_PLAN_REMINDER_TIME,
      },
      prayers,
      adhkarOn: adhkar === "on",
      sunnahFastOn: sunnahFast === "on",
      islamicEvents,
    };
  },
  writePlan: (pref) => setJSON(KEYS.planReminder, pref),
  writePrayers: (prefs) => setJSON(KEYS.prayerReminders, prefs),
  writeAdhkarOn: (on) => setString(KEYS.adhkarReminders, on ? "on" : "off"),
  writeSunnahFastOn: (on) => setString(KEYS.sunnahFastReminders, on ? "on" : "off"),
  writeIslamicEvents: (prefs) => setJSON(KEYS.islamicEventReminders, prefs),
};
