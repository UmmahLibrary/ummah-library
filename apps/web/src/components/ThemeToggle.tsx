"use client";

import { useEffect, useState } from "react";
import { Icon, N } from "@ummahlibrary/ui";
import { useT } from "../i18n/I18nProvider";
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
  const t = useT();

  useEffect(() => {
    setMode(themeMode(normalizeTheme(document.documentElement.dataset.theme)));
  }, []);

  function toggle() {
    const target: ThemeMode = mode === "dark" ? "light" : "dark";
    applyTheme(lastThemeForMode(target));
    setMode(target);
  }

  const label = t(mode === "dark" ? "shell.toLight" : "shell.toDark");
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: 11,
        border: `1px solid ${N.border}`,
        background: N.card,
        color: N.muted,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <Icon name={mode === "dark" ? "sun" : "moon"} size={19} />
    </button>
  );
}
