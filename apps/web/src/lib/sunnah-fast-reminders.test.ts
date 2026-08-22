import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppNotification, Notifier, NotifyPermission } from "@ummahlibrary/core";
import {
  SUNNAH_FAST_REMINDERS_KEY,
  remindersEnabled,
  setRemindersEnabled,
  syncSunnahFastReminder,
} from "./sunnah-fast-reminders";

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

describe("sunnah-fast reminder web wiring", () => {
  it("round-trips the enabled preference through the store", async () => {
    expect(await remindersEnabled()).toBe(false);
    await setRemindersEnabled(true);
    expect(await remindersEnabled()).toBe(true);
  });

  it("dispatches SUNNAH_FAST_REMINDERS_KEY so an open banner re-syncs", async () => {
    const onChange = vi.fn();
    window.addEventListener(SUNNAH_FAST_REMINDERS_KEY, onChange);
    await setRemindersEnabled(true);
    expect(onChange).toHaveBeenCalledOnce();
    window.removeEventListener(SUNNAH_FAST_REMINDERS_KEY, onChange);
  });

  it("schedules nothing without permission", async () => {
    await setRemindersEnabled(true);
    const n = new FakeNotifier("denied");
    await syncSunnahFastReminder(n);
    expect(n.scheduled.size).toBe(0);
  });
});
