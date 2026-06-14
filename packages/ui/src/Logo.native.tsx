import { Pressable, Text, View } from "react-native";
import type { MouseEventHandler } from "react";
import { useNoorTheme } from "./NoorThemeContext";
import { Khatam } from "./Khatam";

interface LogoProps {
  scale?: number;
  color?: string;
  text?: string;
  onClick?: MouseEventHandler<HTMLDivElement> | (() => void);
}

export function Logo({ scale = 1, color, text, onClick }: LogoProps) {
  const c = useNoorTheme();
  const accentColor = color ?? c.accent;
  const textColor = text ?? c.fg;

  const inner = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 * scale }}>
      <Khatam size={26 * scale} color={accentColor} sw={2.2} />
      <Text style={{ fontWeight: "700", fontSize: 17 * scale, color: textColor, letterSpacing: 0.2 }}>
        {"Ummah"}
        <Text style={{ color: accentColor, fontWeight: "600" }}>{" Library"}</Text>
      </Text>
    </View>
  );

  if (onClick) {
    return (
      <Pressable onPress={onClick as () => void}>{inner}</Pressable>
    );
  }
  return inner;
}
