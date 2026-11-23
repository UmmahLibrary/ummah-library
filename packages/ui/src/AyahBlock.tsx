"use client";
import type { CSSProperties, ReactNode } from "react";
import { N } from "./tokens";
import { rad, sp } from "./scale-css";

export interface AyahTranslation {
  key: string;
  /** Translator or edition name, shown small before the text. */
  label?: ReactNode;
  text: ReactNode;
  /** BCP 47 language of the translation, so the right face is used. */
  lang?: string;
  dir?: "ltr" | "rtl";
}

export interface AyahBlockProps {
  /**
   * The Quranic text, rendered by the reader with its end-of-āyah marker.
   * AyahBlock never styles, re-fonts or normalizes it; it only gives it a
   * right-to-left Arabic box.
   */
  arabic: ReactNode;
  /** Between the Arabic and the translations, e.g. a transliteration line. */
  below?: ReactNode;
  translations?: AyahTranslation[];
  /** Show each translation's name (when more than one is on). */
  showLabels?: boolean;
  /** "muted" is the reader's softer-translation comfort setting. */
  translationTone?: "fg" | "muted";
  /** The reader's translation size multiplier (comfort setting); default 1. */
  translationScale?: number;
  /** Per-āyah actions (Play, Memorize, Save, Share), under the translations. */
  actions?: ReactNode;
  /** Last, e.g. the tafsir panel. */
  footer?: ReactNode;
  /** The āyah being recited or jumped to. */
  highlighted?: boolean;
  /** Accessible name, e.g. "Al-Fātiḥah, āyah 1". */
  label?: string;
  id?: string;
  style?: CSSProperties;
}

/**
 * The verse-by-verse āyah (ADR 0042), in the web reader's order on both
 * platforms: Arabic with its end marker, transliteration, translations, then
 * the action row. Layout and spacing only — the Quranic text is passed in
 * already rendered.
 */
export function AyahBlock({
  arabic,
  below,
  translations = [],
  showLabels = translations.length > 1,
  translationTone = "fg",
  translationScale = 1,
  actions,
  footer,
  highlighted,
  label,
  id,
  style,
}: AyahBlockProps) {
  return (
    <article
      id={id}
      aria-label={label}
      style={{
        display: "grid",
        gap: sp(2.5),
        padding: `${sp(5)} ${sp(3)}`,
        borderRadius: rad("md"),
        borderBottom: `1px solid ${N.borderSoft}`,
        background: highlighted ? N.goldSoft : "transparent",
        transition: "background var(--noor-dur-base) var(--noor-ease)",
        ...style,
      }}
    >
      <div lang="ar" dir="rtl">
        {arabic}
      </div>
      {below}
      {translations.map((t) => {
        const rtl = t.dir === "rtl";
        return (
          <p
            key={t.key}
            lang={t.lang}
            dir={t.dir}
            style={{
              margin: 0,
              color: translationTone === "muted" ? N.muted : N.fg,
              // Web reader sizes: 18px at 1.65; right-to-left translations
              // (Urdu, Arabic script) larger with taller lines.
              fontSize: `calc(${rtl ? "1.35rem" : "1.125rem"} * ${translationScale})`,
              lineHeight: rtl ? 2.6 : 1.65,
              textAlign: rtl ? "right" : undefined,
            }}
          >
            {showLabels && t.label && (
              <span
                style={{
                  color: N.faint,
                  fontSize: "0.8rem",
                  marginInlineEnd: "0.4rem",
                }}
              >
                {t.label}
              </span>
            )}
            {t.text}
          </p>
        );
      })}
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: sp(1), flexWrap: "wrap" }}>
          {actions}
        </div>
      )}
      {footer}
    </article>
  );
}
