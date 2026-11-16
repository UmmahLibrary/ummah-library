import type { ReactNode } from "react";
import { Text as RNText, type StyleProp, type TextStyle } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { nativeText, type, type Script, type TypeRole } from "./scale";
import { nativeFamily } from "./native-fonts";
import type { Palette } from "./themes";

export type TextTone = "fg" | "muted" | "faint" | "accent" | "ink";

export interface TextProps {
  children?: ReactNode;
  role?: TypeRole;
  tone?: TextTone;
  script?: Script;
  /** Ignored on native — the element type is web-only. */
  as?: string;
  header?: boolean;
  numberOfLines?: number;
  align?: "start" | "center" | "end";
  lang?: string;
  dir?: "ltr" | "rtl";
  id?: string;
  style?: StyleProp<TextStyle>;
}

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
function hasArabicScript(node: ReactNode): boolean {
  if (typeof node === "string") return ARABIC_SCRIPT.test(node);
  if (Array.isArray(node)) return node.some(hasArabicScript);
  return true; // elements: assume the interface script
}

const toneColor = (c: Palette, tone: TextTone) =>
  ({ fg: c.fg, muted: c.muted, faint: c.faint, accent: c.accent, ink: c.ink })[tone];

/**
 * Interface text on the shared type ramp (ADR 0042), in the Noor face for its
 * weight and script. Never use this for Quranic text.
 *
 * `direction` is pinned to ltr and alignment is explicit, so Android never
 * mirrors the text under the app's right-to-left root; `dir` (or an Arabic
 * `script`) and `align` decide where it sits.
 */
export function Text({
  children,
  role = "body",
  tone = "fg",
  script = "latin",
  header,
  numberOfLines,
  align,
  dir,
  style,
}: TextProps) {
  const c = useNoorTheme();
  // Nastaʿlīq has no Latin letters: a Latin string in an Urdu interface (a
  // surah's transliterated name) keeps the Latin face and its layout.
  const face: Script = script === "nastaliq" && !hasArabicScript(children) ? "latin" : script;
  const rtl = dir === "rtl" || (dir === undefined && script !== "latin");
  const textAlign: TextStyle["textAlign"] =
    align === "center"
      ? "center"
      : align === "end"
        ? rtl
          ? "left"
          : "right"
        : rtl
          ? "right"
          : "left";
  return (
    <RNText
      accessibilityRole={header ? "header" : undefined}
      numberOfLines={numberOfLines}
      style={[
        nativeText(role, face),
        {
          fontFamily: nativeFamily(type[role].weight, face),
          color: toneColor(c, tone),
          direction: "ltr",
          writingDirection: rtl ? "rtl" : "ltr",
          textAlign,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
