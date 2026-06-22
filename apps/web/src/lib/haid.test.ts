import { afterEach, describe, expect, it, vi } from "vitest";
import { currentPeriod } from "@ummahlibrary/core";
import { HAID_EVENT, readHaid, togglePause } from "./haid";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("haid store (web)", () => {
  it("starts with an empty pause log", async () => {
    expect(await readHaid()).toEqual([]);
  });

  it("starts a pause, then ends it on the next toggle, persisting both", async () => {
    const started = await togglePause("2026-06-10");
    expect(currentPeriod(started)?.start).toBe("2026-06-10");
    expect(JSON.parse(localStorage.getItem("ul.haid") ?? "[]")).toEqual([{ start: "2026-06-10" }]);

    const ended = await togglePause("2026-06-16");
    expect(currentPeriod(ended)).toBeUndefined();
    expect((await readHaid())[0]).toEqual({ start: "2026-06-10", end: "2026-06-16" });
  });

  it("emits a change event so subscribers can re-render", async () => {
    const handler = vi.fn();
    window.addEventListener(HAID_EVENT, handler);
    await togglePause("2026-06-10");
    window.removeEventListener(HAID_EVENT, handler);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("falls back to an empty log when stored JSON is corrupt", async () => {
    localStorage.setItem("ul.haid", "[not json");
    expect(await readHaid()).toEqual([]);
  });
});
