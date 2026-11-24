import { afterEach, describe, expect, it, vi } from "vitest";
import { RAMADAN_EVENT, readFasts, readWorship, toggleFast, toggleWorship } from "./ramadan";

afterEach(() => localStorage.clear());

describe("ramadan tracking", () => {
  it("toggles a fast on then off, round-tripping through readFasts", () => {
    expect(readFasts(1448)).toEqual({});
    expect(toggleFast(1448, 3)).toEqual({ "1448:3": true });
    expect(readFasts(1448)).toEqual({ "1448:3": true });
    expect(toggleFast(1448, 3)).toEqual({});
    expect(readFasts(1448)).toEqual({});
  });

  it("keeps each year's fasts apart, reading old year-less entries as the given year", () => {
    localStorage.setItem("ul.ramadanFasts", JSON.stringify({ "3": true }));
    expect(readFasts(1447)).toEqual({ "1447:3": true });
    // Ticking day 3 next Ramaḍān doesn't untick last year's day 3.
    expect(toggleFast(1448, 3, 1447)).toEqual({ "1447:3": true, "1448:3": true });
  });

  it("toggles a worship item for a date, scoped to that date", () => {
    expect(readWorship("2026-03-20")).toEqual({});
    expect(toggleWorship("2026-03-20", "suhur")).toEqual({ suhur: true });
    expect(readWorship("2026-03-20")).toEqual({ suhur: true });
    expect(readWorship("2026-03-21")).toEqual({}); // a different date is untouched
    expect(toggleWorship("2026-03-20", "suhur")).toEqual({});
  });

  it("emits RAMADAN_EVENT so an open page can re-render", () => {
    const onChange = vi.fn();
    window.addEventListener(RAMADAN_EVENT, onChange);
    toggleFast(1448, 1);
    toggleWorship("2026-03-20", "tarawih");
    expect(onChange).toHaveBeenCalledTimes(2);
    window.removeEventListener(RAMADAN_EVENT, onChange);
  });
});
