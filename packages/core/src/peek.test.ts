import { describe, expect, it } from "vitest";
import { clampReveal, isWordRevealed, revealAyah, revealWord, totalWords } from "./peek";

describe("totalWords", () => {
  it("sums the per-āyah word counts", () => {
    expect(totalWords([3, 4, 2])).toBe(9);
  });
  it("is 0 for an empty passage and ignores negative counts", () => {
    expect(totalWords([])).toBe(0);
    expect(totalWords([3, -2, 1])).toBe(4);
  });
});

describe("clampReveal", () => {
  it("passes an in-range cursor through", () => {
    expect(clampReveal(3, 9)).toBe(3);
  });
  it("clamps below 0 and above the total", () => {
    expect(clampReveal(-5, 9)).toBe(0);
    expect(clampReveal(20, 9)).toBe(9);
  });
  it("floors a fractional cursor and resets a non-finite one to 0", () => {
    expect(clampReveal(2.9, 9)).toBe(2);
    expect(clampReveal(Number.NaN, 9)).toBe(0);
  });
});

describe("revealWord", () => {
  it("advances one word at a time and stops at the total", () => {
    expect(revealWord(0, 3)).toBe(1);
    expect(revealWord(2, 3)).toBe(3);
    expect(revealWord(3, 3)).toBe(3);
  });
});

describe("revealAyah", () => {
  const words = [3, 4, 2]; // boundaries at 3, 7, 9

  it("reveals through the end of the first āyah from nothing", () => {
    expect(revealAyah(0, words)).toBe(3);
  });
  it("reveals through the current āyah's end when mid-āyah", () => {
    expect(revealAyah(1, words)).toBe(3);
    expect(revealAyah(3, words)).toBe(7); // cursor sits on the 2nd āyah's first word
    expect(revealAyah(5, words)).toBe(7);
  });
  it("reveals the last āyah and then is a no-op", () => {
    expect(revealAyah(7, words)).toBe(9);
    expect(revealAyah(9, words)).toBe(9);
  });
  it("handles an empty passage", () => {
    expect(revealAyah(0, [])).toBe(0);
  });
});

describe("isWordRevealed", () => {
  it("is true only for indices below the cursor", () => {
    expect(isWordRevealed(0, 2)).toBe(true);
    expect(isWordRevealed(1, 2)).toBe(true);
    expect(isWordRevealed(2, 2)).toBe(false);
  });
});
