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

  it("manages the element-merged collection/set/log keys (v2, ADR 0034 Phase 1+2)", () => {
    for (const key of [
      // Phase 1
      "ul.ayahNotes",
      "ul.collections",
      "ul.qada",
      "ul.haid",
      "ul.badges",
      // Phase 2 — date logs
      "ul.readingLog",
      "ul.prayerLog",
      "ul.ramadanWorship",
    ]) {
      expect(MANAGED_KEYS).toContain(key);
    }
  });

  it("still excludes counters and Phase-3 hifz", () => {
    for (const key of [
      "ul.hifz", // Phase 3 — gated on the incremental-pull cursor
      "ul.hifz.streak", // counter
      "ul.tasbih", // counter
      "ul.searchHistory", // weak identity, low value
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
