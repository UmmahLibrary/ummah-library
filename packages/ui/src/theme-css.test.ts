import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderThemesCss, renderTokensCss } from "./theme-css";
import { noorThemes } from "./themes";

const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), "utf8");

describe("generated theme CSS stays in sync with themes.ts (single source of truth)", () => {
  it("noor-themes.css matches the generator — run `build:themes` if this fails", () => {
    expect(read("./noor-themes.css")).toBe(renderThemesCss());
  });

  it("noor-tokens.css matches the generator — run `build:themes` if this fails", () => {
    expect(read("./noor-tokens.css")).toBe(renderTokensCss());
  });

  it("emits a palette block for every theme plus the legacy light alias", () => {
    const css = renderThemesCss();
    for (const key of Object.keys(noorThemes)) {
      expect(css).toContain(`[data-theme="${key}"]`);
    }
    expect(css).toContain('[data-theme="light"]');
  });
});
