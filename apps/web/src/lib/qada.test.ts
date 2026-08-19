import { adjustQada, setQada } from "@ummahlibrary/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QADA_EVENT, readQada, writeQada } from "./qada";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("qada store (web)", () => {
  it("starts with an empty backlog", async () => {
    expect(await readQada()).toEqual({});
  });

  it("adjusts a backlog up and down, clamped at zero, and persists", async () => {
    await writeQada(adjustQada(await readQada(), "fajr", 1));
    expect((await readQada()).fajr).toBe(1);
    await writeQada(adjustQada(await readQada(), "fajr", 1));
    expect((await readQada()).fajr).toBe(2);
    // Cannot go negative — the entry drops at zero.
    await writeQada(adjustQada(await readQada(), "fajr", -5));
    expect((await readQada()).fajr).toBeUndefined();
    expect(await readQada()).toEqual({});
  });

  it("sets an explicit count and survives a fresh read", async () => {
    await writeQada(setQada(await readQada(), "isha", 4));
    expect((await readQada()).isha).toBe(4);
    await writeQada(setQada(await readQada(), "isha", 0));
    expect(await readQada()).toEqual({});
  });

  it("emits a change event so subscribers can re-render", async () => {
    const handler = vi.fn();
    window.addEventListener(QADA_EVENT, handler);
    await writeQada(adjustQada(await readQada(), "asr", 1));
    window.removeEventListener(QADA_EVENT, handler);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("falls back to an empty backlog when stored JSON is corrupt", async () => {
    localStorage.setItem("ul.qada", "{not json");
    expect(await readQada()).toEqual({});
  });
});
