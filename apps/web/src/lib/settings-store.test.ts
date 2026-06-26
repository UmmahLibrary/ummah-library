import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { webSettingsStore as store } from "./settings-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("webSettingsStore", () => {
  it("reads null for every unset preference", async () => {
    expect(await store.read()).toEqual({
      editions: null,
      readingMode: null,
      readingTranslation: null,
      reciter: null,
      tafsir: null,
      scale: null,
      transliteration: null,
      wordTransliteration: null,
      tapToHear: null,
      script: null,
    });
  });

  it("round-trips every preference under its existing key", async () => {
    await store.writeEditions(["eng-sahih"]);
    await store.writeReadingMode("reading");
    await store.writeReadingTranslation("urd-jalandhry");
    await store.writeReciter("alafasy");
    await store.writeTafsir("ar-muyassar");
    await store.writeScale(1.4);
    await store.writeTransliteration(true);
    await store.writeWordTransliteration(true);
    await store.writeTapToHear(true);
    await store.writeScript("indopak");

    const s = await store.read();
    expect(s.editions).toEqual(["eng-sahih"]);
    expect(s.readingMode).toBe("reading");
    expect(s.readingTranslation).toBe("urd-jalandhry");
    expect(s.reciter).toBe("alafasy");
    expect(s.tafsir).toBe("ar-muyassar");
    expect(s.scale).toBe(1.4);
    expect(s.transliteration).toBe(true);
    expect(s.wordTransliteration).toBe(true);
    expect(s.tapToHear).toBe(true);
    expect(s.script).toBe("indopak");

    // editions and scale are JSON; the rest are plain strings (unchanged format)
    expect(localStorage.getItem("ul.editions")).toBe('["eng-sahih"]');
    expect(localStorage.getItem("ul.scale")).toBe("1.4");
    expect(localStorage.getItem("ul.reciter")).toBe("alafasy");
    expect(localStorage.getItem("ul.script")).toBe("indopak");
  });

  it("rejects a corrupt/peer-synced scale or editions of the wrong shape", async () => {
    localStorage.setItem("ul.scale", '"big"'); // a string, not a number → NaN font size
    localStorage.setItem("ul.editions", '{"not":"an array"}');
    const s = await store.read();
    expect(s.scale).toBeNull(); // falls back; consumers use the default scale
    expect(s.editions).toBeNull();
  });
});
