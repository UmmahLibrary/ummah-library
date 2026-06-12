import { describe, expect, it, beforeEach } from "vitest";
import { lastThemeForMode, normalizeTheme, themeMode } from "./themes";

describe("themes", () => {
  beforeEach(() => localStorage.clear());

  it("resolves legacy and unknown values to real keys", () => {
    expect(normalizeTheme("dark")).toBe("obsidian");
    expect(normalizeTheme("light")).toBe("ivory");
    expect(normalizeTheme("ocean")).toBe("ocean");
    expect(normalizeTheme("nonsense")).toBe("obsidian");
    expect(normalizeTheme(null)).toBe("obsidian");
  });

  it("reports the mode of a theme", () => {
    expect(themeMode("ocean")).toBe("dark");
    expect(themeMode("rose")).toBe("light");
  });

  it("remembers the last theme per mode, falling back to defaults", () => {
    expect(lastThemeForMode("dark")).toBe("obsidian");
    expect(lastThemeForMode("light")).toBe("ivory");

    localStorage.setItem("ul.lastDark", "emerald");
    localStorage.setItem("ul.lastLight", "sepia");
    expect(lastThemeForMode("dark")).toBe("emerald");
    expect(lastThemeForMode("light")).toBe("sepia");

    // A stored value from the wrong mode is ignored.
    localStorage.setItem("ul.lastLight", "ocean");
    expect(lastThemeForMode("light")).toBe("ivory");
  });
});
