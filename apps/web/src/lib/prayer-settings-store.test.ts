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
      highLatitudeRule: "none",
    });
  });

  it("round-trips coords, method, madhab, and the high-latitude rule", async () => {
    await store.writeCoords({ latitude: 21.42, longitude: 39.83 });
    await store.writeMethod("Egyptian");
    await store.writeMadhab("hanafi");
    await store.writeHighLatitudeRule("SeventhOfTheNight");

    expect(await store.read()).toEqual({
      coords: { latitude: 21.42, longitude: 39.83 },
      method: "Egyptian",
      madhab: "hanafi",
      highLatitudeRule: "SeventhOfTheNight",
    });
    expect(localStorage.getItem("ul.prayerCoords")).toBe('{"latitude":21.42,"longitude":39.83}');
    expect(localStorage.getItem("ul.prayerMethod")).toBe("Egyptian");
    expect(localStorage.getItem("ul.prayerHighLat")).toBe("SeventhOfTheNight");
  });

  it("ignores an unknown stored high-latitude rule", async () => {
    localStorage.setItem("ul.prayerHighLat", "bogus");
    expect((await store.read()).highLatitudeRule).toBe("none");
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
