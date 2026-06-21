import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppNotification, Notifier, NotifyPermission } from "@ummahlibrary/core";
import {
  anyPrayerReminderOn,
  readPrayerReminderPrefs,
  setPrayerReminder,
  syncPrayerReminders,
} from "./prayer-reminders";

class FakeNotifier implements Notifier {
  scheduled = new Map<string, AppNotification>();
  constructor(private readonly perm: NotifyPermission = "granted") {}
  isSupported() {
    return true;
  }
  permission() {
    return this.perm;
  }
  async requestPermission() {
    return this.perm;
  }
  async schedule(n: AppNotification) {
    this.scheduled.set(n.id, n);
  }
  async cancel(id: string) {
    this.scheduled.delete(id);
  }
  async cancelAll() {
    this.scheduled.clear();
  }
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("prayer reminder web wiring", () => {
  it("round-trips per-prayer preferences through the store", async () => {
    expect(await readPrayerReminderPrefs()).toEqual({});
    const next = await setPrayerReminder("fajr", true);
    expect(next.fajr).toBe(true);
    expect(await readPrayerReminderPrefs()).toEqual({ fajr: true });
  });

  it("anyPrayerReminderOn reflects whether any obligatory prayer is enabled", () => {
    expect(anyPrayerReminderOn({})).toBe(false);
    expect(anyPrayerReminderOn({ sunrise: true })).toBe(false); // sunrise isn't obligatory
    expect(anyPrayerReminderOn({ dhuhr: true })).toBe(true);
  });

  it("schedules nothing without permission", async () => {
    await setPrayerReminder("dhuhr", true);
    const n = new FakeNotifier("denied");
    await syncPrayerReminders(n);
    expect(n.scheduled.size).toBe(0);
  });
});
