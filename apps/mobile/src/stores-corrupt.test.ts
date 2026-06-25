/**
 * Mobile store read()-boundary hardening (QA cycle 4) — mirrors the web cycle-3
 * guards. A corrupt or #25-peer-synced value of the wrong shape must fall back
 * gracefully instead of crashing a consumer. AsyncStorage is mocked in-memory.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: async (k: string) => {
      mem.delete(k);
    },
  },
}));

import { mobileLibraryStore } from "./state/library-store";
import { mobilePlanStore } from "./plan-store";
import { mobileSettingsStore } from "./state/settings-store";
import { mobileQadaStore } from "./qada-store";
import { mobilePrayerTrackerStore } from "./prayer-tracker-store";
import { mobileHaidStore } from "./haid-store";
import { mobileFastingQadaStore } from "./fasting-qada-store";
import { mobileAchievementsStore } from "./achievements-store";
import { mobileReadingGoalsStore } from "./reading-goals-store";
import { mobileTasbihStore } from "./tasbih-store";
import { mobileReminderStore } from "./reminder-store";
import { mobilePrayerSettingsStore } from "./prayer-settings-store";

beforeEach(() => mem.clear());

describe("mobile store read() corrupt-value hardening", () => {
  it("library: non-array bookmarks/collections and array-shaped notes fall back (no .includes crash)", async () => {
    mem.set("ul.bookmarks", '"nope"');
    mem.set("ul.collections", "42");
    mem.set("ul.ayahNotes", "[1,2]"); // an array, not a record
    expect(await mobileLibraryStore.readBookmarks()).toEqual([]);
    expect(await mobileLibraryStore.readCollections()).toEqual([]);
    expect(await mobileLibraryStore.readNotes()).toEqual({});
  });

  it("plan: a structurally-corrupt plan reads null (never reaches planDuration)", async () => {
    for (const bad of [
      "{}",
      '{"template":null,"startDate":"2026-01-01","unitsRead":0}',
      '{"template":{"schedule":{"kind":"fixed"},"range":{"units":[]}},"startDate":"2026-01-01","unitsRead":0}',
      "[]",
      "5",
    ]) {
      mem.set("ul.readingPlan", bad);
      expect(await mobilePlanStore.read()).toBeNull();
    }
  });

  it("settings: a non-number scale / wrong-shape editions fall back to null", async () => {
    mem.set("ul.scale", '"big"'); // a string → would be a NaN font size
    mem.set("ul.editions", '{"x":1}'); // an object, not string[]
    const s = await mobileSettingsStore.read();
    expect(s.scale).toBeNull();
    expect(s.editions).toBeNull();
  });

  it("data-layer stores fall back on corrupt shapes (qada/tracker/haid/badges/goals/tasbih/reminder)", async () => {
    for (const bad of ["null", "[]", "5"]) {
      for (const k of [
        "ul.qada",
        "ul.prayerLog",
        "ul.haid",
        "ul.fastingQada",
        "ul.badges",
        "ul.readingActive",
        "ul.readingLog",
        "ul.tasbih",
        "ul.planReminder",
        "ul.prayerReminders",
      ]) {
        mem.set(k, bad);
      }
      expect(await mobileQadaStore.read()).toEqual({});
      expect(await mobilePrayerTrackerStore.read()).toEqual({});
      expect(await mobileHaidStore.read()).toEqual([]);
      expect(await mobileFastingQadaStore.read()).toEqual({ madeUp: 0 });
      expect(await mobileAchievementsStore.read()).toEqual([]);
      const g = await mobileReadingGoalsStore.read();
      expect(g.log).toEqual({});
      expect(Array.isArray(g.activeDates)).toBe(true);
      expect(await mobileTasbihStore.read()).toBeNull();
      const r = await mobileReminderStore.read();
      expect(r.plan.on).toBe(false); // no crash on plan.on
      expect(typeof r.prayers).toBe("object");
    }
  });

  it("prayer-settings: corrupt coords / unknown method / bad madhab fall back", async () => {
    mem.set("ul.prayerCoords", "5");
    mem.set("ul.prayerMethod", "EvilMethod");
    mem.set("ul.prayerMadhab", "garbage");
    const s = await mobilePrayerSettingsStore.read();
    expect(s.coords).toBeNull();
    expect(s.method).not.toBe("EvilMethod");
    expect(s.madhab).toBe("shafi");
  });
});
