import { describe, expect, it } from "vitest";
import { PLAYBACK_SPEEDS, clampPlaybackRate, cyclePlaybackRate, repeatRange } from "./audio";

describe("clampPlaybackRate", () => {
  it("passes through an in-band rate", () => {
    expect(clampPlaybackRate(1.25)).toBe(1.25);
  });
  it("clamps to the [0.5, 2] band", () => {
    expect(clampPlaybackRate(0.1)).toBe(0.5);
    expect(clampPlaybackRate(5)).toBe(2);
  });
  it("falls back to 1 for a non-finite rate", () => {
    expect(clampPlaybackRate(Number.NaN)).toBe(1);
    expect(clampPlaybackRate(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("cyclePlaybackRate", () => {
  it("advances through every step and wraps to the start", () => {
    let rate: number = PLAYBACK_SPEEDS[0]!;
    const seen: number[] = [rate];
    for (let i = 0; i < PLAYBACK_SPEEDS.length; i++) {
      rate = cyclePlaybackRate(rate);
      seen.push(rate);
    }
    expect(seen.slice(0, PLAYBACK_SPEEDS.length)).toEqual([...PLAYBACK_SPEEDS]);
    expect(rate).toBe(PLAYBACK_SPEEDS[0]); // wrapped back to the first
  });
  it("jumps to the first step from an off-grid rate", () => {
    expect(cyclePlaybackRate(1.1)).toBe(PLAYBACK_SPEEDS[0]);
  });
});

describe("repeatRange", () => {
  const verses = [
    { sura: 2, aya: 1 },
    { sura: 2, aya: 2 },
    { sura: 2, aya: 3 },
    { sura: 2, aya: 4 },
  ];
  it("returns the inclusive A→B slice", () => {
    expect(repeatRange(verses, "2:2", "2:3")).toEqual([
      { sura: 2, aya: 2 },
      { sura: 2, aya: 3 },
    ]);
  });
  it("normalizes a reversed selection", () => {
    expect(repeatRange(verses, "2:3", "2:2")).toEqual([
      { sura: 2, aya: 2 },
      { sura: 2, aya: 3 },
    ]);
  });
  it("returns the whole list when a bound is missing or absent", () => {
    expect(repeatRange(verses, null, "2:3")).toHaveLength(4);
    expect(repeatRange(verses, "2:1", undefined)).toHaveLength(4);
    expect(repeatRange(verses, "2:1", "9:9")).toHaveLength(4);
  });
  it("a single-ayah range is just that ayah", () => {
    expect(repeatRange(verses, "2:3", "2:3")).toEqual([{ sura: 2, aya: 3 }]);
  });
});
