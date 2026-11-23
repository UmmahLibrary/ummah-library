/**
 * `mobilePrayerSettingsStore.read()`'s validate-or-fall-back branches (method,
 * madhab, high-latitude rule, coords) — the previously untested thin adapter
 * that decides what prayer-time settings actually reach the calculation layer.
 * A corrupted or legacy stored value silently propagating here would mean a
 * wrong calculation method or coordinate feeding a real prayer-time answer,
 * not just a cosmetic bug. AsyncStorage is mocked in-memory, same pattern as
 * `storage.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CALCULATION_METHOD, DEFAULT_HIGH_LATITUDE_RULE } from "@ummahlibrary/core";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: async (k: string) => {
      mem.delete(k);
    },
  },
}));

import { mobilePrayerSettingsStore } from "./prayer-settings-store";

beforeEach(() => mem.clear());

describe("mobilePrayerSettingsStore.read", () => {
  it("returns all defaults when nothing is stored", async () => {
    expect(await mobilePrayerSettingsStore.read()).toEqual({
      coords: null,
      method: DEFAULT_CALCULATION_METHOD,
      madhab: "shafi",
      highLatitudeRule: DEFAULT_HIGH_LATITUDE_RULE,
    });
  });

  it("passes through valid stored values unchanged", async () => {
    mem.set("ul.prayerMethod", "Egyptian");
    mem.set("ul.prayerMadhab", "hanafi");
    mem.set("ul.prayerHighLat", "MiddleOfTheNight");
    mem.set("ul.prayerCoords", JSON.stringify({ latitude: 21.42, longitude: 39.83 }));
    expect(await mobilePrayerSettingsStore.read()).toEqual({
      coords: { latitude: 21.42, longitude: 39.83 },
      method: "Egyptian",
      madhab: "hanafi",
      highLatitudeRule: "MiddleOfTheNight",
    });
  });

  it("falls back to the default method for an unrecognized stored id", async () => {
    mem.set("ul.prayerMethod", "NotARealMethod");
    expect((await mobilePrayerSettingsStore.read()).method).toBe(DEFAULT_CALCULATION_METHOD);
  });

  it("falls back to the default high-latitude rule for an unrecognized stored id", async () => {
    mem.set("ul.prayerHighLat", "NotARealRule");
    expect((await mobilePrayerSettingsStore.read()).highLatitudeRule).toBe(
      DEFAULT_HIGH_LATITUDE_RULE,
    );
  });

  it("falls back to shafi for any madhab value other than hanafi", async () => {
    mem.set("ul.prayerMadhab", "garbage");
    expect((await mobilePrayerSettingsStore.read()).madhab).toBe("shafi");
  });

  it("rejects coords with a non-finite latitude or longitude, falling back to null", async () => {
    mem.set("ul.prayerCoords", JSON.stringify({ latitude: NaN, longitude: 39.83 }));
    expect((await mobilePrayerSettingsStore.read()).coords).toBeNull();
  });

  it("rejects a coords value of the wrong shape, falling back to null", async () => {
    mem.set("ul.prayerCoords", JSON.stringify("21.42,39.83"));
    expect((await mobilePrayerSettingsStore.read()).coords).toBeNull();
  });
});

describe("mobilePrayerSettingsStore writes", () => {
  it("round-trip: writeMethod then read returns the written value", async () => {
    await mobilePrayerSettingsStore.writeMethod("Karachi");
    expect((await mobilePrayerSettingsStore.read()).method).toBe("Karachi");
  });

  it("round-trip: writeCoords(null) reads back as null, not a stale value", async () => {
    await mobilePrayerSettingsStore.writeCoords({ latitude: 1, longitude: 2 });
    await mobilePrayerSettingsStore.writeCoords(null);
    expect((await mobilePrayerSettingsStore.read()).coords).toBeNull();
  });
});
