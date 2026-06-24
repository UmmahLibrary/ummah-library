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

  it("manages the Phase-1 element-merged collection/set keys (v2, ADR 0034)", () => {
    for (const key of ["ul.ayahNotes", "ul.collections", "ul.qada", "ul.haid", "ul.badges"]) {
      expect(MANAGED_KEYS).toContain(key);
    }
  });

  it("still excludes counters and the Phase-2/3 keys (hifz, date logs)", () => {
    for (const key of [
      "ul.hifz", // Phase 3 — gated on the incremental-pull cursor
      "ul.hifz.streak", // counter
      "ul.tasbih", // counter
      "ul.prayerLog", // Phase 2 — date log
      "ul.readingLog", // Phase 2 — date log
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
