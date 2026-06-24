import { describe, expect, it } from "vitest";
import { MANAGED_KEYS } from "./managed-keys";

describe("MANAGED_KEYS", () => {
  it("syncs bookmarks and the core scalar settings", () => {
    for (const key of [
      "ul.bookmarks",
      "ul.theme",
      "ul.lastRead",
      "ul.reciter",
      "ul.scale",
      "ul.prayerMethod",
      "ul.prayerCoords",
    ]) {
      expect(MANAGED_KEYS).toContain(key);
    }
  });

  it("never syncs the sync sidecar itself (would be a feedback loop)", () => {
    expect(MANAGED_KEYS).not.toContain("ul.sync.meta");
    expect(MANAGED_KEYS).not.toContain("ul.sync.node");
  });

  it("excludes collection/log/counter keys that need element-level merge (v2)", () => {
    for (const key of [
      "ul.collections",
      "ul.ayahNotes",
      "ul.hifz",
      "ul.hifz.streak",
      "ul.prayerLog",
      "ul.qada",
      "ul.haid",
      "ul.tasbih2",
      "ul.searchHistory",
      "ul.badges",
      "ul.readingLog",
    ]) {
      expect(MANAGED_KEYS).not.toContain(key);
    }
  });

  it("excludes device-local flags", () => {
    expect(MANAGED_KEYS).not.toContain("ul.onboarded");
  });

  it("has no duplicates", () => {
    expect(new Set(MANAGED_KEYS).size).toBe(MANAGED_KEYS.length);
  });
});
