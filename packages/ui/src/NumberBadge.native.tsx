import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { Khatam } from "./Khatam";
import { NATIVE_FONT } from "./native-fonts";

export interface NumberBadgeProps {
  n: ReactNode;
  size?: number;
}

/** A surah or āyah number inside the Khatam star (ADR 0042), as on web. */
export function NumberBadge({ n, size = 40 }: NumberBadgeProps) {
  const c = useNoorTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Khatam size={size} color={c.accent} sw={1.2} opacity={0.55} />
      <Text
        maxFontSizeMultiplier={1.3}
        style={{
          position: "absolute",
          fontSize: Math.round(size * 0.32 * 10) / 10,
          fontFamily: NATIVE_FONT.bold,
          color: c.accent,
          fontVariant: ["tabular-nums"],
        }}
      >
        {n}
      </Text>
    </View>
  );
}
