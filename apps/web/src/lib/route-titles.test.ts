import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTE_TITLES, routeTitleKey } from "./route-titles";
import { MESSAGES } from "../i18n/messages";

const APP = resolve(__dirname, "../app");
// Pages titled by their content (names) or without their own title.
const CONTENT_NAMED = new Set(["surah", "page", "listen", "api"]);

describe("translated tab titles", () => {
  it("every top-level app page has a translated title or is content-named", () => {
    const routes = readdirSync(APP).filter((d) => statSync(resolve(APP, d)).isDirectory());
    const missing = routes.filter((d) => !CONTENT_NAMED.has(d) && !ROUTE_TITLES[`/${d}`]);
    expect(missing).toEqual([]);
  });

  it("every title exists in every interface language", () => {
    for (const [locale, messages] of Object.entries(MESSAGES)) {
      for (const key of Object.values(ROUTE_TITLES)) {
        expect(messages[key], `${locale} ${key}`).toBeTruthy();
      }
    }
  });

  it("keeps content-named pages as built", () => {
    expect(routeTitleKey("/surah/18")).toBeNull();
    expect(routeTitleKey("/hadith/bukhari")).toBeNull();
    expect(routeTitleKey("/")).toBeNull();
    expect(routeTitleKey("/qibla")).toBe("nav.qibla");
    expect(routeTitleKey("/settings/")).toBe("common.settings");
  });
});
