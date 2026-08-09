import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readReviewLog, recordReview, writeReviewLog } from "./hifz-review-log-store";

const KEY = "ul.hifz.reviewLog";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("hifz-review-log-store", () => {
  it("reads an empty log by default", () => {
    expect(readReviewLog()).toEqual({});
  });

  it("round-trips a written log", () => {
    writeReviewLog({ "2026-06-01": 2, "2026-06-02": 1 });
    expect(readReviewLog()).toEqual({ "2026-06-01": 2, "2026-06-02": 1 });
  });

  it("falls back to empty on malformed JSON", () => {
    localStorage.setItem(KEY, "{nope");
    expect(readReviewLog()).toEqual({});
  });

  it("falls back to empty on a corrupt/peer-synced shape (null, array, or scalar)", () => {
    for (const bad of ["null", "[1,2,3]", '"just a string"', "42"]) {
      localStorage.setItem(KEY, bad);
      expect(readReviewLog()).toEqual({});
    }
  });

  it("records a review at the given instant, incrementing that day's count", () => {
    const now = new Date("2026-06-15T10:00:00Z");
    recordReview(now);
    expect(readReviewLog()).toEqual({ "2026-06-15": 1 });
    recordReview(now);
    expect(readReviewLog()).toEqual({ "2026-06-15": 2 });
  });
});
