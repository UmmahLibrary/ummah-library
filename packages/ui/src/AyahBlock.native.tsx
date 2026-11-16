import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { radius, space, type } from "./scale";
import { Text } from "./Text";

export interface AyahTranslation {
  key: string;
  label?: ReactNode;
  text: ReactNode;
  lang?: string;
  dir?: "ltr" | "rtl";
}

export interface AyahBlockProps {
  number: ReactNode;
  /** The Quranic text, rendered by the reader and never restyled here. */
  arabic: ReactNode;
  translations?: AyahTranslation[];
  actions?: ReactNode;
  children?: ReactNode;
  highlighted?: boolean;
  label?: string;
  id?: string;
  /** The reader's translation size multiplier (comfort setting); default 1. */
  translationScale?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The verse-by-verse āyah frame (ADR 0042), matching the web: number and
 * actions, the Quranic text, then translations. Layout and spacing only.
 */
export function AyahBlock({
  number,
  arabic,
  translations = [],
  actions,
  children,
  highlighted,
  label,
  translationScale = 1,
  style,
}: AyahBlockProps) {
  const c = useNoorTheme();
  return (
    <View
      accessibilityLabel={label}
      style={[
        {
          gap: space[4],
          padding: space[4],
          borderRadius: radius.lg,
          backgroundColor: highlighted ? c.accentSoft : "transparent",
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          direction: "ltr",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space[3],
          flexWrap: "wrap",
        }}
      >
        {number}
        {actions ? (
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: space[1], flexWrap: "wrap" }}
          >
            {actions}
          </View>
        ) : null}
      </View>
      <View style={{ paddingVertical: space[1] }}>{arabic}</View>
      {translations.length > 0 ? (
        <View style={{ gap: space[4] }}>
          {translations.map((t) => (
            <View key={t.key} style={{ gap: space[1] }}>
              {t.label ? (
                <Text role="caption" tone="muted" dir={t.dir}>
                  {t.label}
                </Text>
              ) : null}
              <Text
                role="body"
                dir={t.dir}
                style={{
                  fontSize: type.body.size * translationScale,
                  lineHeight: type.body.lineHeight * translationScale,
                }}
              >
                {t.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {children}
    </View>
  );
}
