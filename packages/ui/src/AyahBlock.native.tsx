import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { radius, space } from "./scale";
import { nativeFamily } from "./native-fonts";

export interface AyahTranslation {
  key: string;
  label?: ReactNode;
  text: ReactNode;
  lang?: string;
  dir?: "ltr" | "rtl";
}

export interface AyahBlockProps {
  /** The Quranic text with its end marker, rendered by the reader and never
   *  restyled here. */
  arabic: ReactNode;
  below?: ReactNode;
  translations?: AyahTranslation[];
  showLabels?: boolean;
  translationTone?: "fg" | "muted";
  translationScale?: number;
  actions?: ReactNode;
  footer?: ReactNode;
  highlighted?: boolean;
  label?: string;
  id?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The verse-by-verse āyah (ADR 0042), in the web reader's order: Arabic with
 * its end marker, transliteration, translations, then the action row.
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
  style,
}: AyahBlockProps) {
  const c = useNoorTheme();
  return (
    <View
      accessibilityLabel={label}
      style={[
        {
          gap: space[2.5],
          paddingVertical: space[5],
          paddingHorizontal: space[3],
          marginHorizontal: -space[3],
          borderRadius: radius.md,
          borderBottomWidth: 1,
          borderBottomColor: highlighted ? "transparent" : c.borderSoft,
          backgroundColor: highlighted ? c.accentSoft : "transparent",
        },
        style,
      ]}
    >
      {arabic}
      {below}
      {translations.map((t) => {
        const rtl = t.dir === "rtl";
        const urdu = t.lang === "ur";
        const script = urdu ? "nastaliq" : rtl ? "arabic" : "latin";
        // Web reader sizes: 18 at 1.65; right-to-left translations larger with
        // taller lines, Urdu (Nastaʿlīq) the tallest.
        const size = (rtl ? 21 : 18) * translationScale;
        const leading = urdu ? 2.2 : rtl ? 1.75 : 1.65;
        return (
          <Text
            key={t.key}
            style={{
              color: translationTone === "muted" ? c.muted : c.fg,
              fontSize: size,
              lineHeight: Math.round(size * leading),
              fontFamily: nativeFamily(400, script),
              // Pinned ltr so Android never mirrors it under the RTL root;
              // writingDirection and textAlign place it.
              direction: "ltr",
              writingDirection: rtl ? "rtl" : "ltr",
              textAlign: rtl ? "right" : "left",
            }}
          >
            {showLabels && t.label ? (
              <Text
                style={{
                  color: c.faint,
                  fontSize: 13,
                  fontFamily: nativeFamily(500, script),
                }}
              >
                {t.label}
                {"  "}
              </Text>
            ) : null}
            {t.text}
          </Text>
        );
      })}
      {actions ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space[1],
            flexWrap: "wrap",
          }}
        >
          {actions}
        </View>
      ) : null}
      {footer}
    </View>
  );
}
