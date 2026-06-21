import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppNotification, Notifier, NotifyPermission } from "@ummahlibrary/core";
import {
  ADHKAR_EMOJI,
  ADHKAR_LABEL,
  ensureTodaysTimings,
  readCoords,
  remindersEnabled,
  setRemindersEnabled,
  syncAdhkarReminder,
} from "./adhkar-reminders";

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

describe("adhkar reminder web wiring", () => {
  it("round-trips the enabled preference through the store", async () => {
    expect(await remindersEnabled()).toBe(false);
    await setRemindersEnabled(true);
    expect(await remindersEnabled()).toBe(true);
  });

  it("reads coords from the shared prayer settings", async () => {
    expect(await readCoords()).toBeNull();
    localStorage.setItem("ul.prayerCoords", JSON.stringify({ latitude: 1, longitude: 2 }));
    expect(await readCoords()).toEqual({ latitude: 1, longitude: 2 });
  });

  it("returns null timings without a stored location", async () => {
    expect(await ensureTodaysTimings()).toBeNull();
  });

  it("schedules nothing when enabled but no location is set", async () => {
    await setRemindersEnabled(true);
    const n = new FakeNotifier("granted");
    await syncAdhkarReminder(n);
    expect(n.scheduled.size).toBe(0);
  });

  it("exposes display labels for each occasion", () => {
    expect(ADHKAR_LABEL.morning).toBe("morning");
    expect(ADHKAR_EMOJI.evening.length).toBeGreaterThan(0);
  });
});
