"use client";
import type { CSSProperties, ReactNode } from "react";
import { N } from "./tokens";
import { scriptLeading, type Script, type TypeRole } from "./scale";
import { text } from "./scale-css";

export type TextTone = "fg" | "muted" | "faint" | "accent" | "ink";

export interface TextProps {
  children?: ReactNode;
  /** Step of the shared type ramp (ADR 0042). */
  role?: TypeRole;
  tone?: TextTone;
  /** Script of the text, for line height. Arabic script gets taller lines. */
  script?: Script;
  /** Element to render on web. Headings should use h1–h4. */
  as?: "span" | "p" | "div" | "label" | "h1" | "h2" | "h3" | "h4";
  /** Native: marks the text as a heading for screen readers (web uses `as`). */
  header?: boolean;
  /** Truncate after this many lines. */
  numberOfLines?: number;
  align?: "start" | "center" | "end";
  lang?: string;
  dir?: "ltr" | "rtl";
  id?: string;
  style?: CSSProperties;
}

export const TONE: Record<TextTone, string> = {
  fg: N.fg,
  muted: N.muted,
  faint: N.faint,
  accent: N.gold,
  ink: N.ink,
};

/**
 * Interface text on the shared type ramp. Sets size, line height, weight and
 * colour only; the font family comes from the page (Hanken Grotesk, or the
 * Arabic/Urdu face the page sets for those languages). Never use this for
 * Quranic text, which the reader sets itself.
 */
export function Text({
  children,
  role = "body",
  tone = "fg",
  script = "latin",
  as: Tag = "span",
  numberOfLines,
  align,
  lang,
  dir,
  id,
  style,
}: TextProps) {
  const s: CSSProperties = {
    margin: 0,
    color: TONE[tone],
    ...text(role),
    ...(script !== "latin" && {
      // Taller unitless leading for Arabic script; no case or tracking.
      lineHeight: scriptLeading[script],
      letterSpacing: undefined,
      textTransform: undefined,
    }),
    ...(align && { textAlign: align }),
    ...(numberOfLines && {
      display: "-webkit-box",
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }),
    ...style,
  };
  return (
    <Tag style={s} lang={lang} dir={dir} id={id}>
      {children}
    </Tag>
  );
}
