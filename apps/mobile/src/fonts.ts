/**
 * Noor typography for mobile. The web loads Hanken Grotesk (UI) and IBM Plex
 * Sans Arabic (Arabic) via next/font; mobile loads the same families through
 * expo-font so the two platforms render identically (ADR 0023). React Native
 * picks a face by family *name* (it doesn't synthesise weights from one file),
 * so each weight is its own family — use `FONT.*` in styles instead of relying
 * on `fontWeight` for custom text.
 */
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from "@expo-google-fonts/hanken-grotesk";
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-arabic";

/** Family names to use in StyleSheet `fontFamily`. */
export const FONT = {
  regular: "HankenGrotesk_400Regular",
  medium: "HankenGrotesk_500Medium",
  semibold: "HankenGrotesk_600SemiBold",
  bold: "HankenGrotesk_700Bold",
  extrabold: "HankenGrotesk_800ExtraBold",
  ar: "IBMPlexSansArabic_400Regular",
  arMedium: "IBMPlexSansArabic_500Medium",
  arSemibold: "IBMPlexSansArabic_600SemiBold",
  arBold: "IBMPlexSansArabic_700Bold",
} as const;

/** The map passed to `useFonts` at app start. */
export const fontMap = {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
};

/** Map a CSS-ish weight to the matching Hanken family (for the global default). */
export function uiFamilyForWeight(weight?: string | number): string {
  switch (String(weight)) {
    case "500":
      return FONT.medium;
    case "600":
      return FONT.semibold;
    case "700":
      return FONT.bold;
    case "800":
    case "900":
      return FONT.extrabold;
    default:
      return FONT.regular;
  }
}
