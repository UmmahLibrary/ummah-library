import { afterEach, describe, expect, it, vi } from "vitest";
import { QADA_EVENT, adjustQadaCount, readQada, setQadaCount } from "./qada";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("qada store (web)", () => {
  it("starts with an empty backlog", async () => {
    expect(await readQada()).toEqual({});
  });

  it("adjusts a backlog up and down, clamped at zero, and persists", async () => {
    expect((await adjustQadaCount("fajr", 1)).fajr).toBe(1);
    expect((await adjustQadaCount("fajr", 1)).fajr).toBe(2);
    // Cannot go negative — the entry drops at zero.
    expect((await adjustQadaCount("fajr", -5)).fajr).toBeUndefined();
    expect(await readQada()).toEqual({});
  });

  it("sets an explicit count and survives a fresh read", async () => {
    await setQadaCount("isha", 4);
    expect((await readQada()).isha).toBe(4);
    await setQadaCount("isha", 0);
    expect(await readQada()).toEqual({});
  });

  it("emits a change event so subscribers can re-render", async () => {
    const handler = vi.fn();
    window.addEventListener(QADA_EVENT, handler);
    await adjustQadaCount("asr", 1);
    window.removeEventListener(QADA_EVENT, handler);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("falls back to an empty backlog when stored JSON is corrupt", async () => {
    localStorage.setItem("ul.qada", "{not json");
    expect(await readQada()).toEqual({});
  });
});
