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
        // Web reader sizes: 18 at 1.65; right-to-left translations larger with
        // taller lines (the Naskh face needs less than web's Nastaʿlīq).
        const size = (rtl ? 21 : 18) * translationScale;
        return (
          <Text
            key={t.key}
            style={{
              color: translationTone === "muted" ? c.muted : c.fg,
              fontSize: size,
              lineHeight: Math.round(size * (rtl ? 1.75 : 1.65)),
              fontFamily: nativeFamily(400, rtl ? "arabic" : "latin"),
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
                  fontFamily: nativeFamily(500, rtl ? "arabic" : "latin"),
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
