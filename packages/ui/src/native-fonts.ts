/**
 * Native font family names for Noor's interface faces (ADR 0042).
 *
 * React Native picks a face by family *name* and won't synthesise weights, so
 * each weight is its own family. These are the names the mobile app registers
 * with expo-font (apps/mobile/src/fonts.ts); a mobile test keeps them equal.
 * Quranic faces are not here: Quran text is always set by the reader itself.
 */
import type { Script } from "./scale";

export const NATIVE_FONT = {
  regular: "HankenGrotesk_400Regular",
  medium: "HankenGrotesk_500Medium",
  semibold: "HankenGrotesk_600SemiBold",
  bold: "HankenGrotesk_700Bold",
  extrabold: "HankenGrotesk_800ExtraBold",
  ar: "IBMPlexSansArabic_400Regular",
  arMedium: "IBMPlexSansArabic_500Medium",
  arSemibold: "IBMPlexSansArabic_600SemiBold",
  arBold: "IBMPlexSansArabic_700Bold",
  ur: "NotoNastaliqUrdu_400Regular",
  urMedium: "NotoNastaliqUrdu_500Medium",
  urSemibold: "NotoNastaliqUrdu_600SemiBold",
  urBold: "NotoNastaliqUrdu_700Bold",
} as const;

/** The interface family for a weight in a script: Hanken Grotesk (Latin),
 *  IBM Plex Sans Arabic (Arabic) or Noto Nastaliq Urdu (Urdu), as on web. */
export function nativeFamily(weight: number, script: Script = "latin"): string {
  if (script === "nastaliq") {
    if (weight >= 700) return NATIVE_FONT.urBold;
    if (weight >= 600) return NATIVE_FONT.urSemibold;
    if (weight >= 500) return NATIVE_FONT.urMedium;
    return NATIVE_FONT.ur;
  }
  if (script !== "latin") {
    if (weight >= 700) return NATIVE_FONT.arBold;
    if (weight >= 600) return NATIVE_FONT.arSemibold;
    if (weight >= 500) return NATIVE_FONT.arMedium;
    return NATIVE_FONT.ar;
  }
  if (weight >= 800) return NATIVE_FONT.extrabold;
  if (weight >= 700) return NATIVE_FONT.bold;
  if (weight >= 600) return NATIVE_FONT.semibold;
  if (weight >= 500) return NATIVE_FONT.medium;
  return NATIVE_FONT.regular;
}
