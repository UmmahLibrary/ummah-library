/**
 * Cross-store read()-boundary hardening (QA cycle 5). A corrupt or #25-peer-synced
 * value of the wrong shape must fall back gracefully, never crash a consumer
 * (Object.entries(null), `.includes` on a non-array, `null.surah`, …).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { webQadaStore } from "./qada-store";
import { webPrayerTrackerStore } from "./prayer-tracker-store";
import { webHaidStore } from "./haid-store";
import { webFastingQadaStore } from "./fasting-qada-store";
import { readHistory } from "./search-history-store";
import { webAchievementsStore } from "./achievements-store";
import { readLearned } from "./asma-store";
import { readLastRead } from "./reader-prefs-store";
import { readFastsRaw, readWorshipRaw } from "./ramadan-store";
import { webReadingGoalsStore } from "./reading-goals-store";
import { readStreak } from "./hifz-streak-store";
import { readStored } from "./adhkar-counts-store";
import { webPrayerSettingsStore } from "./prayer-settings-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("store read() corrupt-value hardening (web)", () => {
  it("object-map stores fall back to {} on a non-object value", async () => {
    for (const bad of ["null", "[]", "5", '"x"']) {
      localStorage.setItem("ul.qada", bad);
      localStorage.setItem("ul.prayerLog", bad);
      localStorage.setItem("ul.asmaLearned", bad);
      localStorage.setItem("ul.fastingQada", bad);
      expect(await webQadaStore.read()).toEqual({});
      expect(await webPrayerTrackerStore.read()).toEqual({});
      expect(readLearned()).toEqual({});
      expect(await webFastingQadaStore.read()).toEqual({ madeUp: 0 });
    }
  });

  it("array stores fall back to [] on a non-array value", async () => {
    for (const bad of ["null", "{}", "5", '"x"']) {
      localStorage.setItem("ul.haid", bad);
      localStorage.setItem("ul.searchHistory", bad);
      localStorage.setItem("ul.badges", bad);
      expect(await webHaidStore.read()).toEqual([]);
      expect(readHistory()).toEqual([]);
      expect(await webAchievementsStore.read()).toEqual([]);
    }
  });

  it("readLastRead returns null for null / non-object / non-number (no .surah crash)", () => {
    const cases: [string, number | null][] = [
      ["null", null],
      ["5", null],
      ['{"surah":"x"}', null],
      ['{"surah":7}', 7],
    ];
    for (const [bad, expected] of cases) {
      localStorage.setItem("ul.lastRead", bad);
      expect(readLastRead()).toBe(expected);
    }
  });

  it("ramadan / reading-goals / hifz-streak fall back on corrupt shapes", async () => {
    for (const bad of ["null", "[]", "5"]) {
      for (const k of [
        "ul.ramadanFasts",
        "ul.ramadanWorship",
        "ul.readingActive",
        "ul.readingLog",
        "ul.readingPages",
        "ul.hifz.streak",
      ]) {
        localStorage.setItem(k, bad);
      }
      expect(readFastsRaw()).toEqual({});
      expect(readWorshipRaw()).toEqual({});
      const g = await webReadingGoalsStore.read();
      expect(Array.isArray(g.activeDates)).toBe(true);
      expect(g.log).toEqual({});
      expect(g.pages).toEqual({ date: "", pages: [] });
      expect(readStreak()).toEqual({ count: 0, lastDate: "" });
    }
  });

  it("adhkar-counts returns null unless `counts` is a usable map", () => {
    for (const bad of ["null", "5", "[]", "{}", '{"date":"x"}', '{"counts":[]}']) {
      localStorage.setItem("ul.adhkar", bad);
      expect(readStored()).toBeNull();
    }
    localStorage.setItem("ul.adhkar", '{"date":"2026-06-24","counts":{"a":3}}');
    expect(readStored()).toEqual({ date: "2026-06-24", counts: { a: 3 } });
  });

  it("prayer-settings: corrupt coords / unknown method / bad madhab fall back to safe values", async () => {
    localStorage.setItem("ul.prayerCoords", "5"); // not a {lat,lng} object
    localStorage.setItem("ul.prayerMethod", "EvilMethod"); // not a known method id
    localStorage.setItem("ul.prayerMadhab", "garbage"); // not shafi/hanafi
    const s = await webPrayerSettingsStore.read();
    expect(s.coords).toBeNull();
    expect(s.method).not.toBe("EvilMethod");
    expect(s.madhab).toBe("shafi");
  });
});
