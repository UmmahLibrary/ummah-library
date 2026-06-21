import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrayerTimings } from "@ummahlibrary/core";
import { webPrayerTimingsProvider as provider } from "./prayer-timings-provider";

const TIMINGS: PrayerTimings = {
  fajr: "2026-06-21T03:00:00.000Z",
  sunrise: "2026-06-21T04:30:00.000Z",
  dhuhr: "2026-06-21T12:00:00.000Z",
  asr: "2026-06-21T15:30:00.000Z",
  maghrib: "2026-06-21T19:00:00.000Z",
  isha: "2026-06-21T20:30:00.000Z",
};

const setCoords = () =>
  localStorage.setItem("ul.prayerCoords", JSON.stringify({ latitude: 21.42, longitude: 39.83 }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("webPrayerTimingsProvider", () => {
  it("returns null when no location is stored", async () => {
    expect(await provider.getTodaysTimings()).toBeNull();
  });

  it("fetches today's timings once and serves the rest from cache", async () => {
    setCoords();
    const fetchMock = vi.fn(
      async () => ({ ok: true, json: async () => ({ timings: TIMINGS }) }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await provider.getTodaysTimings()).toEqual(TIMINGS);
    expect(await provider.getTodaysTimings()).toEqual(TIMINGS); // cache hit
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null on a non-ok response", async () => {
    setCoords();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false }) as Response));
    expect(await provider.getTodaysTimings()).toBeNull();
  });

  it("returns null when the request throws", async () => {
    setCoords();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await provider.getTodaysTimings()).toBeNull();
  });
});
