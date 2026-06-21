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
import { KEYS, getJSON, getString, setJSON, setString } from "./storage";

export const mobileReminderStore: ReminderStore = {
  read: async (): Promise<ReminderPrefs> => {
    const [plan, prayers, adhkar] = await Promise.all([
      getJSON<PlanReminderPref>(KEYS.planReminder, { on: false, time: DEFAULT_PLAN_REMINDER_TIME }),
      getJSON<Partial<Record<PrayerName, boolean>>>(KEYS.prayerReminders, {}),
      getString(KEYS.adhkarReminders),
    ]);
    return {
      plan: {
        on: plan.on === true,
        time: typeof plan.time === "string" ? plan.time : DEFAULT_PLAN_REMINDER_TIME,
      },
      prayers,
      adhkarOn: adhkar === "on",
    };
  },
  writePlan: (pref) => setJSON(KEYS.planReminder, pref),
  writePrayers: (prefs) => setJSON(KEYS.prayerReminders, prefs),
  writeAdhkarOn: (on) => setString(KEYS.adhkarReminders, on ? "on" : "off"),
};
