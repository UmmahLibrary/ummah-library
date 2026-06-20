import { afterEach, describe, expect, it } from "vitest";
import { applyTheme, getStoredTheme, readThemeSync, setStoredTheme, THEME_KEYS } from "./theme";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("theme", () => {
  it("exposes all eight Noor themes", () => {
    expect(THEME_KEYS).toContain("obsidian");
    expect(THEME_KEYS).toContain("ivory");
    expect(THEME_KEYS).toHaveLength(8);
  });

  it("defaults to obsidian when nothing is stored or the value is invalid", () => {
    expect(readThemeSync()).toBe("obsidian");
    localStorage.setItem("ul.ext.themeMirror", "not-a-theme");
    expect(readThemeSync()).toBe("obsidian");
  });

  it("applyTheme sets data-theme on <html>", () => {
    applyTheme("emerald");
    expect(document.documentElement.dataset.theme).toBe("emerald");
  });

  it("setStoredTheme applies, mirrors synchronously, and persists", async () => {
    await setStoredTheme("ocean");
    expect(document.documentElement.dataset.theme).toBe("ocean");
    expect(readThemeSync()).toBe("ocean"); // synchronous mirror written
    expect(await getStoredTheme()).toBe("ocean"); // authoritative read agrees
  });

  it("getStoredTheme falls back to the default for unknown values", async () => {
    expect(await getStoredTheme()).toBe("obsidian");
  });
});
