import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { webPrayerSettingsStore as store } from "./prayer-settings-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("webPrayerSettingsStore", () => {
  it("reads the defaults when nothing is stored", async () => {
    expect(await store.read()).toEqual({
      coords: null,
      method: "MuslimWorldLeague",
      madhab: "shafi",
    });
  });

  it("round-trips coords, method, and madhab under the existing keys", async () => {
    await store.writeCoords({ latitude: 21.42, longitude: 39.83 });
    await store.writeMethod("Egyptian");
    await store.writeMadhab("hanafi");

    expect(await store.read()).toEqual({
      coords: { latitude: 21.42, longitude: 39.83 },
      method: "Egyptian",
      madhab: "hanafi",
    });
    expect(localStorage.getItem("ul.prayerCoords")).toBe('{"latitude":21.42,"longitude":39.83}');
    expect(localStorage.getItem("ul.prayerMethod")).toBe("Egyptian");
  });

  it("clears the stored location when coords are written null", async () => {
    await store.writeCoords({ latitude: 1, longitude: 2 });
    await store.writeCoords(null);
    expect((await store.read()).coords).toBeNull();
    expect(localStorage.getItem("ul.prayerCoords")).toBeNull();
  });

  it("falls back to defaults on a malformed coords value", async () => {
    localStorage.setItem("ul.prayerCoords", "{not json");
    expect((await store.read()).coords).toBeNull();
  });
});
