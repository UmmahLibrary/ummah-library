import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AR_SCALE_MAX,
  AR_SCALE_MIN,
  DEFAULT_COMFORT,
  TR_SCALE_MAX,
  TR_SCALE_MIN,
  mergeComfort,
  parseComfort,
  stepScale,
  targetSize,
} from "./comfort";
import { goToNames, planGoTo, weekdayLabel } from "./goto-nav";
import { MAX_SCALE, MIN_SCALE } from "./types";

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

import { readComfort, writeComfort } from "./comfort-store";

beforeEach(() => mem.clear());

describe("parseComfort", () => {
  it("returns defaults for missing or corrupt input", () => {
    expect(parseComfort(null)).toEqual(DEFAULT_COMFORT);
    expect(parseComfort("not json")).toEqual(DEFAULT_COMFORT);
    expect(parseComfort("[1,2]")).toEqual(DEFAULT_COMFORT);
    expect(parseComfort("null")).toEqual(DEFAULT_COMFORT);
  });

  it("keeps valid fields and drops invalid ones", () => {
    const c = parseComfort(
      JSON.stringify({
        trScale: 1.4,
        trEmphasis: "soft",
        showStreaks: true,
        trackingPaused: "yes",
        mode: "easy",
        largeButtons: 1,
      }),
    );
    expect(c.trScale).toBe(1.4);
    expect(c.trEmphasis).toBe("soft");
    expect(c.showStreaks).toBe(true);
    expect(c.trackingPaused).toBe(false);
    expect(c.mode).toBe("easy");
    expect(c.largeButtons).toBe(false);
  });

  it("clamps the translation size into range", () => {
    expect(parseComfort(JSON.stringify({ trScale: 9 })).trScale).toBe(TR_SCALE_MAX);
    expect(parseComfort(JSON.stringify({ trScale: 0.1 })).trScale).toBe(TR_SCALE_MIN);
    expect(parseComfort(JSON.stringify({ trScale: Number.NaN })).trScale).toBe(1);
  });

  it("defaults habit display to gentle: no days-in-a-row, tracking on", () => {
    expect(DEFAULT_COMFORT.showStreaks).toBe(false);
    expect(DEFAULT_COMFORT.trackingPaused).toBe(false);
  });
});

describe("mergeComfort", () => {
  it("applies a patch and re-validates it", () => {
    const next = mergeComfort(DEFAULT_COMFORT, { mode: "easy", trScale: 5 });
    expect(next.mode).toBe("easy");
    expect(next.trScale).toBe(TR_SCALE_MAX);
  });
});

describe("stepScale", () => {
  it("steps, rounds and clamps", () => {
    expect(stepScale(1, 0.1, 0.7, 2.4)).toBe(1.1);
    expect(stepScale(1.1 + 0.1, 0.1, 0.7, 2.4)).toBe(1.3);
    expect(stepScale(2.35, 0.1, 0.7, 2.4)).toBe(2.4);
    expect(stepScale(0.75, -0.1, 0.7, 2.4)).toBe(0.7);
  });
});

describe("Arabic size range", () => {
  it("only ever grows, so a size saved under the old 0.8–1.6 range survives", () => {
    expect(MIN_SCALE).toBe(AR_SCALE_MIN);
    expect(MAX_SCALE).toBe(AR_SCALE_MAX);
    expect(AR_SCALE_MIN).toBeLessThanOrEqual(0.8);
    expect(AR_SCALE_MAX).toBeGreaterThanOrEqual(1.6);
  });
});

describe("targetSize", () => {
  it("is at least 48dp and grows with larger buttons / Easy mode", () => {
    expect(targetSize({ largeButtons: false, mode: "standard" })).toBe(48);
    expect(targetSize({ largeButtons: true, mode: "standard" })).toBe(56);
    expect(targetSize({ largeButtons: false, mode: "easy" })).toBeGreaterThanOrEqual(64);
  });
});

describe("comfort-store", () => {
  it("round-trips through ul.comfort", async () => {
    expect(await readComfort()).toEqual(DEFAULT_COMFORT);
    await writeComfort({ ...DEFAULT_COMFORT, mode: "easy", trScale: 1.5 });
    expect(mem.has("ul.comfort")).toBe(true);
    const back = await readComfort();
    expect(back.mode).toBe("easy");
    expect(back.trScale).toBe(1.5);
  });

  it("tolerates a corrupt stored value", async () => {
    mem.set("ul.comfort", "{broken");
    expect(await readComfort()).toEqual(DEFAULT_COMFORT);
  });
});

describe("planGoTo", () => {
  it("scrolls in place within the open surah and remembers where you were", () => {
    expect(planGoTo({ kind: "ayah", sura: 18, aya: 60 }, 18, 10)).toEqual({
      type: "scroll",
      aya: 60,
      backTo: 10,
    });
  });

  it("offers no Back-to when already there or when nothing was read yet", () => {
    expect(planGoTo({ kind: "ayah", sura: 18, aya: 10 }, 18, 10)).toEqual({
      type: "scroll",
      aya: 10,
      backTo: null,
    });
    expect(planGoTo({ kind: "ayah", sura: 18, aya: 5 }, 18, 0)).toEqual({
      type: "scroll",
      aya: 5,
      backTo: null,
    });
  });

  it("navigates to another surah", () => {
    expect(planGoTo({ kind: "juz", sura: 2, aya: 142, n: 2 }, 18, 10)).toEqual({
      type: "navigate",
      sura: 2,
      aya: 142,
    });
  });
});

describe("goToNames", () => {
  it("keeps only the fields core needs", () => {
    expect(
      goToNames([
        {
          number: 1,
          name: "الفاتحة",
          transliteration: "Al-Fatiha",
          englishName: "The Opening",
          ayahCount: 7,
        } as never,
      ]),
    ).toEqual([
      { number: 1, name: "الفاتحة", transliteration: "Al-Fatiha", englishName: "The Opening" },
    ]);
  });
});

describe("weekdayLabel", () => {
  it("labels calendar dates without timezone drift", () => {
    expect(weekdayLabel("2026-11-14")).toBe("Sat");
    expect(weekdayLabel("2026-11-15")).toBe("Sun");
  });
});
