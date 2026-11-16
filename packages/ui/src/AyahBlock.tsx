"use client";
import type { CSSProperties, ReactNode } from "react";
import { N } from "./tokens";
import { rad, sp } from "./scale-css";
import { Text } from "./Text";

export interface AyahTranslation {
  key: string;
  /** Translator or edition name, shown small above the text. */
  label?: ReactNode;
  text: ReactNode;
  /** BCP 47 language of the translation, so the right face is used. */
  lang?: string;
  dir?: "ltr" | "rtl";
}

export interface AyahBlockProps {
  /** The āyah number badge (the app's own Khatam marker). */
  number: ReactNode;
  /**
   * The Quranic text, rendered by the reader. AyahBlock never styles,
   * re-fonts or normalizes it; it only gives it a right-to-left Arabic box.
   */
  arabic: ReactNode;
  translations?: AyahTranslation[];
  /** Per-āyah actions (Play, Memorize, Save, Share). */
  actions?: ReactNode;
  /** Below the translations, e.g. a tafsir link. */
  children?: ReactNode;
  /** The āyah being recited or jumped to. */
  highlighted?: boolean;
  /** Accessible name, e.g. "Al-Fātiḥah, āyah 1". */
  label?: string;
  id?: string;
  /** The reader's translation size multiplier (comfort setting); default 1. */
  translationScale?: number;
  style?: CSSProperties;
}

/**
 * The verse-by-verse āyah frame (ADR 0042), the same on web and mobile:
 * number and actions on one line, then the Quranic text, then translations.
 * Layout and spacing only — the Quranic text is passed in already rendered.
 */
export function AyahBlock({
  number,
  arabic,
  translations = [],
  actions,
  children,
  highlighted,
  label,
  id,
  translationScale = 1,
  style,
}: AyahBlockProps) {
  return (
    <article
      id={id}
      aria-label={label}
      style={{
        display: "grid",
        gap: sp(4),
        padding: `${sp(4)} ${sp(4)}`,
        borderRadius: rad("lg"),
        background: highlighted ? N.goldSoft : "transparent",
        transition: "background var(--noor-dur-slow) var(--noor-ease)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: sp(3),
          flexWrap: "wrap",
        }}
      >
        {number}
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: sp(1), flexWrap: "wrap" }}>
            {actions}
          </div>
        )}
      </div>
      <div lang="ar" dir="rtl" style={{ paddingBlock: sp(1) }}>
        {arabic}
      </div>
      {translations.length > 0 && (
        <div style={{ display: "grid", gap: sp(4) }}>
          {translations.map((t) => (
            <div key={t.key} lang={t.lang} dir={t.dir} style={{ display: "grid", gap: sp(1) }}>
              {t.label && (
                <Text role="caption" tone="muted">
                  {t.label}
                </Text>
              )}
              <Text
                as="p"
                role="body"
                style={{
                  fontSize: `calc(var(--noor-text-body) * ${translationScale})`,
                  lineHeight: `calc(var(--noor-leading-body) * ${translationScale})`,
                }}
              >
                {t.text}
              </Text>
            </div>
          ))}
        </div>
      )}
      {children}
    </article>
  );
}
