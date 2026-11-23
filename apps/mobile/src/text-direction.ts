import type { TextStyle } from "react-native";

/**
 * Text that keeps its own direction regardless of the interface language
 * (ADR 0041). The app lays itself out right-to-left for Arabic and Urdu, and
 * Android then swaps "left"/"right" alignment inside that layout — so content
 * text (translations, transliteration) is pinned to a fixed layout direction
 * and aligned by its *own* script: an English translation stays left-aligned
 * in an Urdu interface; an Urdu translation stays right-aligned in an English
 * one. Quranic text uses the same idea (its styles carry `direction: "ltr"`
 * with an explicit right alignment and `writingDirection: "rtl"`).
 */
export const LTR_TEXT: TextStyle = { direction: "ltr", writingDirection: "ltr", textAlign: "left" };
export const RTL_TEXT: TextStyle = {
  direction: "ltr",
  writingDirection: "rtl",
  textAlign: "right",
};

export function textDir(dir: "ltr" | "rtl" | undefined): TextStyle {
  return dir === "rtl" ? RTL_TEXT : LTR_TEXT;
}
