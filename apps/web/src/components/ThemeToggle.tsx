"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  lastThemeForMode,
  normalizeTheme,
  themeMode,
  type ThemeMode,
} from "../lib/themes";

/**
 * Quick light↔dark switch for the top bar. Flipping a mode restores the theme
 * last used in it (defaulting to Obsidian / Ivory); the full eight-theme picker
 * lives in Settings.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    setMode(themeMode(normalizeTheme(document.documentElement.dataset.theme)));
  }, []);

  function toggle() {
    const target: ThemeMode = mode === "dark" ? "light" : "dark";
    applyTheme(lastThemeForMode(target));
    setMode(target);
  }

  return (
    <button
      type="button"
      className="head-link theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} theme`}
    >
      {mode === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
