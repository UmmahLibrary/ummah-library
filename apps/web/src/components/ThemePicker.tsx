"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Icon, N } from "@ummahlibrary/ui";
import {
  THEMES,
  applyTheme,
  normalizeTheme,
  type ThemeKey,
  type ThemeMeta,
  type ThemeMode,
} from "../lib/themes";

const GROUPS: { mode: ThemeMode; label: string; icon: "moon" | "sun" }[] = [
  { mode: "dark", label: "Dark", icon: "moon" },
  { mode: "light", label: "Light", icon: "sun" },
];

/**
 * A theme swatch: a mini-mockup of the app rendered in that theme's own colours.
 * The preview area carries `data-theme={key}`, so its `var(--noor-*)` resolve to
 * that palette regardless of the app's active theme; the card chrome and footer
 * stay in the active theme via the `N` tokens.
 */
function ThemeSwatch({
  theme,
  active,
  onClick,
}: {
  theme: ThemeMeta;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 0,
        border: `1.5px solid ${active ? N.gold : N.border}`,
        background: N.card,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: N.ui,
      }}
    >
      <div
        data-theme={theme.key}
        style={{
          height: 78,
          background: "var(--noor-bg)",
          padding: 11,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              background: "var(--noor-gold-grad)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 5,
                borderRadius: 3,
                background: "var(--noor-fg)",
                opacity: 0.9,
                width: "70%",
                marginBottom: 4,
              }}
            />
            <div
              style={{ height: 4, borderRadius: 3, background: "var(--noor-muted)", width: "45%" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <span
            style={{
              flex: 1,
              height: 16,
              borderRadius: 5,
              background: "var(--noor-card)",
              border: "1px solid var(--noor-border)",
            }}
          />
          <span
            style={{
              width: 30,
              height: 16,
              borderRadius: 5,
              background: "var(--noor-gold-soft)",
              border: "1px solid var(--noor-gold)",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 11px",
          borderTop: `1px solid ${N.borderSoft}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: active ? N.gold : N.fg }}>
            {theme.label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: N.faint,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {theme.desc}
          </div>
        </div>
        {active && (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: N.goldGrad,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={13} color={N.ink} />
          </div>
        )}
      </div>
    </button>
  );
}

export function ThemePicker() {
  const [active, setActive] = useState<ThemeKey>("obsidian");

  useEffect(() => {
    setActive(normalizeTheme(document.documentElement.dataset.theme));
  }, []);

  function choose(key: ThemeKey) {
    applyTheme(key);
    setActive(key);
  }

  const sectionLabel: CSSProperties = {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: N.faint,
    fontWeight: 700,
    margin: 0,
  };

  return (
    <section aria-label="Theme" style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h2 style={sectionLabel}>Theme</h2>
        <span style={{ fontSize: 12, color: N.faint }}>Applies across the whole app</span>
      </div>
      {GROUPS.map((group) => (
        <div key={group.mode} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11.5,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: N.faint,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            <Icon name={group.icon} size={14} /> {group.label}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 11,
            }}
          >
            {THEMES.filter((t) => t.mode === group.mode).map((t) => (
              <ThemeSwatch
                key={t.key}
                theme={t}
                active={active === t.key}
                onClick={() => choose(t.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
