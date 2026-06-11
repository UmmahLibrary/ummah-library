import { describe, expect, it, vi } from "vitest";
import { HIJRI_ADJUST_KEY, readHijriAdjust, writeHijriAdjust } from "./hijri";

describe("hijri adjustment", () => {
  it("defaults to 0 when nothing is stored", () => {
    expect(readHijriAdjust()).toBe(0);
  });

  it("round-trips a written value", () => {
    writeHijriAdjust(1);
    expect(readHijriAdjust()).toBe(1);
    expect(localStorage.getItem(HIJRI_ADJUST_KEY)).toBe("1");
  });

  it("clamps to ±2 days", () => {
    writeHijriAdjust(5);
    expect(readHijriAdjust()).toBe(2);
    writeHijriAdjust(-9);
    expect(readHijriAdjust()).toBe(-2);
  });

  it("ignores a corrupt stored value", () => {
    localStorage.setItem(HIJRI_ADJUST_KEY, "not-a-number");
    expect(readHijriAdjust()).toBe(0);
  });

  it("broadcasts the change on write", () => {
    const handler = vi.fn();
    window.addEventListener(HIJRI_ADJUST_KEY, handler);
    writeHijriAdjust(2);
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(HIJRI_ADJUST_KEY, handler);
  });
});
