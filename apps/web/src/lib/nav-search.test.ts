import { describe, expect, it } from "vitest";
import { searchText } from "@ummahlibrary/core";
import { FEATURE_KEYWORDS, NAV_DESTINATIONS } from "./nav";
import { en } from "../i18n/messages";

const index = NAV_DESTINATIONS.flatMap((d) =>
  d.items.map((f) => ({ href: f.href, text: `${en[f.label]} ${en[f.note]} ${FEATURE_KEYWORDS[f.href] ?? ""}` })),
);
const top = (q: string) => searchText(index, q)[0]?.href;

describe("finding a feature in your own words", () => {
  it("every feature has search keywords", () => {
    for (const f of index) expect(FEATURE_KEYWORDS[f.href], f.href).toBeTruthy();
  });

  it.each([
    ["namaz", "/prayer-times"],
    ["kaaba", "/qibla"],
    ["beads", "/tasbih"],
    ["charity", "/zakat"],
    ["memorize", "/hifz"],
    ["bigger text", "/settings"],
  ])("“%s” finds %s", (q, href) => {
    expect(top(q)).toBe(href);
  });
});
