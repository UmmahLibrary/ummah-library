"use client";

import { useEffect, useState } from "react";
import { THEMES, applyTheme, normalizeTheme, type ThemeKey, type ThemeMode } from "../lib/themes";

const GROUPS: { mode: ThemeMode; label: string }[] = [
  { mode: "dark", label: "Dark" },
  { mode: "light", label: "Light" },
];

export function ThemePicker() {
  const [active, setActive] = useState<ThemeKey>("obsidian");

  useEffect(() => {
    setActive(normalizeTheme(document.documentElement.dataset.theme));
  }, []);

  function choose(key: ThemeKey) {
    applyTheme(key);
    setActive(key);
  }

  return (
    <section className="theme-picker" aria-label="Theme">
      <h2 className="theme-picker-title">Theme</h2>
      {GROUPS.map((group) => (
        <div key={group.mode} className="theme-group">
          <p className="theme-group-label">{group.label}</p>
          <div className="theme-grid">
            {THEMES.filter((t) => t.mode === group.mode).map((t) => (
              <button
                key={t.key}
                type="button"
                className="theme-option"
                aria-pressed={active === t.key}
                onClick={() => choose(t.key)}
              >
                <span className="theme-swatch" style={{ background: t.swatch[0] }}>
                  <span className="theme-swatch-dot" style={{ background: t.swatch[1] }} />
                </span>
                <span className="theme-option-text">
                  <span className="theme-option-name">{t.label}</span>
                  <span className="theme-option-desc">{t.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
