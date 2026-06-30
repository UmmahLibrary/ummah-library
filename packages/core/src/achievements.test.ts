import { describe, expect, it } from "vitest";
import {
  BADGES,
  type Badge,
  type BadgeStats,
  evaluateBadges,
  newlyUnlocked,
  unlockedCount,
  unlockedIds,
} from "./achievements";

const ZERO: BadgeStats = {
  memorized: 0,
  surahsStarted: 0,
  prayerStreak: 0,
  bestStreak: 0,
  namesLearned: 0,
  savedVerses: 0,
};

describe("BADGES catalogue", () => {
  it("has unique, stable ids and positive targets", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(BADGES.every((b) => b.target > 0)).toBe(true);
  });

  it("pins each badge's id, scored metric, target and category", () => {
    // id is the persisted acknowledgement key, and `metric`/`target` drive
    // evaluateBadges (a blanked metric makes a badge silently never unlock), so
    // pin the full behavioural contract — not just display copy.
    expect(BADGES.map((b) => [b.id, b.metric, b.target, b.category])).toEqual([
      ["first-ayah", "memorized", 1, "memorize"],
      ["memorizer-10", "memorized", 10, "memorize"],
      ["memorizer-50", "memorized", 50, "memorize"],
      ["surah-starter", "surahsStarted", 1, "memorize"],
      ["surah-five", "surahsStarted", 5, "memorize"],
      ["streak-7", "bestStreak", 7, "prayer"],
      ["streak-30", "bestStreak", 30, "prayer"],
      ["streak-100", "bestStreak", 100, "prayer"],
      ["prayer-7", "prayerStreak", 7, "prayer"],
      ["names-10", "namesLearned", 10, "knowledge"],
      ["names-99", "namesLearned", 99, "knowledge"],
      ["collector-5", "savedVerses", 5, "library"],
      ["collector-25", "savedVerses", 25, "library"],
    ]);
  });

  it("gives every badge a non-empty glyph, name and description", () => {
    for (const b of BADGES) {
      expect(b.glyph.length).toBeGreaterThan(0);
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
    }
  });

  it("scores every badge against a real BadgeStats key", () => {
    const keys = Object.keys(ZERO);
    for (const b of BADGES) expect(keys).toContain(b.metric);
  });
});

describe("evaluateBadges", () => {
  it("locks everything for a fresh user", () => {
    const result = evaluateBadges(ZERO);
    expect(result).toHaveLength(BADGES.length);
    expect(result.every((b) => !b.unlocked)).toBe(true);
    expect(result.every((b) => b.progress === 0)).toBe(true);
  });

  it("unlocks a badge when its metric meets the target", () => {
    const result = evaluateBadges({ ...ZERO, memorized: 1 });
    const first = result.find((b) => b.badge.id === "first-ayah");
    expect(first?.unlocked).toBe(true);
    expect(first?.progress).toBe(1);
    // A higher-tier badge on the same metric stays locked, with partial progress.
    const ten = result.find((b) => b.badge.id === "memorizer-10");
    expect(ten?.unlocked).toBe(false);
    expect(ten?.progress).toBeCloseTo(0.1);
  });

  it("treats missing/negative stat values as zero", () => {
    // A deliberately malformed snapshot (e.g. corrupt storage).
    const bad = { ...ZERO, memorized: -5 } as BadgeStats;
    const first = evaluateBadges(bad).find((b) => b.badge.id === "first-ayah");
    expect(first?.value).toBe(0);
    expect(first?.unlocked).toBe(false);
  });

  it("clamps progress at 1 when the value exceeds the target", () => {
    const result = evaluateBadges({ ...ZERO, savedVerses: 999 });
    const collector = result.find((b) => b.badge.id === "collector-5");
    expect(collector?.unlocked).toBe(true);
    expect(collector?.progress).toBe(1);
  });

  it("supports a custom catalogue (extensibility)", () => {
    const custom: Badge[] = [
      { id: "x", glyph: "x", name: "X", description: "", category: "library", metric: "savedVerses", target: 2 },
    ];
    const result = evaluateBadges({ ...ZERO, savedVerses: 2 }, custom);
    expect(result).toHaveLength(1);
    expect(result[0]?.unlocked).toBe(true);
  });

  it("treats a non-positive target as already complete", () => {
    const custom: Badge[] = [
      { id: "free", glyph: "·", name: "Free", description: "", category: "library", metric: "savedVerses", target: 0 },
    ];
    expect(evaluateBadges(ZERO, custom)[0]?.progress).toBe(1);
  });
});

describe("unlockedIds / unlockedCount", () => {
  it("returns the unlocked ids and their count", () => {
    const stats = { ...ZERO, memorized: 1, bestStreak: 7 };
    const ids = unlockedIds(stats);
    expect(ids).toContain("first-ayah");
    expect(ids).toContain("streak-7");
    expect(ids).not.toContain("streak-30");
    expect(unlockedCount(stats)).toBe(ids.length);
  });
});

describe("newlyUnlocked", () => {
  it("returns unlocked badges not yet acknowledged", () => {
    const stats = { ...ZERO, memorized: 1, bestStreak: 7 };
    const fresh = newlyUnlocked(stats, ["first-ayah"]);
    expect(fresh.map((b) => b.id)).toEqual(["streak-7"]);
  });

  it("is empty once everything unlocked has been acknowledged", () => {
    const stats = { ...ZERO, memorized: 1 };
    expect(newlyUnlocked(stats, unlockedIds(stats))).toEqual([]);
  });
});
