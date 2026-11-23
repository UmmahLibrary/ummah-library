import { describe, expect, it } from "vitest";
import { HUBS, QURAN_LINKS, TAB_OF } from "./routes";
import { localeScript } from "../i18n/config";

describe("navigation groups match web (ADR 0042)", () => {
  it("every hub tile opens a screen in its own tab", () => {
    for (const [hub, items] of Object.entries(HUBS)) {
      for (const item of items) expect(TAB_OF[item.screen], item.screen).toBe(hub);
    }
  });

  it("the Quran shortcuts stay in the Quran tab", () => {
    for (const l of QURAN_LINKS) expect(TAB_OF[l.screen], l.screen).toBe("Read");
  });

  it("memorization, goals, bookmarks and tafsir live in Quran, as on web", () => {
    for (const s of ["HifzDashboard", "ReadingGoals", "Collections", "Tafsir"] as const) {
      expect(TAB_OF[s]).toBe("Read");
    }
    expect(TAB_OF.Names).toBe("Learn");
    expect(TAB_OF.Tasbih).toBe("More");
    expect(TAB_OF.Qibla).toBe("Prayer");
  });
});

describe("interface script", () => {
  it("sets Urdu in Nastaʿlīq and Arabic in Naskh", () => {
    expect(localeScript("ur")).toBe("nastaliq");
    expect(localeScript("ar")).toBe("arabic");
    expect(localeScript("en")).toBe("latin");
    expect(localeScript("bn")).toBe("latin");
  });
});
