import { describe, expect, it } from "vitest";
import { homeUrl, settingsUrl, surahUrl } from "./links";

describe("links", () => {
  it("links to a surah without an anchor when no ayah is given", () => {
    expect(surahUrl(36)).toBe("https://ummahlibrary.org/surah/36");
  });

  it("anchors at the ayah via the #sura:aya hash the reader understands", () => {
    expect(surahUrl(2, 255)).toBe("https://ummahlibrary.org/surah/2#2:255");
  });

  it("exposes the home and settings URLs", () => {
    expect(homeUrl()).toBe("https://ummahlibrary.org");
    expect(settingsUrl()).toBe("https://ummahlibrary.org/settings");
  });
});
