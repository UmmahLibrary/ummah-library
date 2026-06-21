import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { countLearned, readLearned, writeLearned } from "./asma-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("asma-store", () => {
  it("reads an empty map by default", () => {
    expect(readLearned()).toEqual({});
    expect(countLearned()).toBe(0);
  });

  it("round-trips the learned set and counts it", () => {
    writeLearned({ 1: true, 5: true });
    expect(readLearned()).toEqual({ 1: true, 5: true });
    expect(countLearned()).toBe(2);
  });

  it("falls back to empty on a malformed value", () => {
    localStorage.setItem("ul.asmaLearned", "{nope");
    expect(readLearned()).toEqual({});
    expect(countLearned()).toBe(0);
  });
});
