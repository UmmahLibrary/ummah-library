import { afterEach, describe, expect, it, vi } from "vitest";
import { RAMADAN_EVENT, readFasts, readWorship, toggleFast, toggleWorship } from "./ramadan";

afterEach(() => localStorage.clear());

describe("ramadan tracking", () => {
  it("toggles a fast on then off, round-tripping through readFasts", () => {
    expect(readFasts()).toEqual({});
    expect(toggleFast(3)).toEqual({ 3: true });
    expect(readFasts()).toEqual({ 3: true });
    expect(toggleFast(3)).toEqual({});
    expect(readFasts()).toEqual({});
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
    toggleFast(1);
    toggleWorship("2026-03-20", "tarawih");
    expect(onChange).toHaveBeenCalledTimes(2);
    window.removeEventListener(RAMADAN_EVENT, onChange);
  });
});
