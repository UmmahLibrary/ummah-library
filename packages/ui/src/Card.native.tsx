import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { nativeShadow, radius, space, type ElevationLevel, type SpaceStep } from "./scale";

export type CardTone = "default" | "accent" | "soft";

export interface CardProps {
  children?: ReactNode;
  padding?: SpaceStep;
  gap?: SpaceStep;
  tone?: CardTone;
  elevation?: ElevationLevel;
  onPress?: () => void;
  /** Ignored on native — navigate in `onPress`. */
  href?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/** The Noor card surface (ADR 0042), matching the web card. */
export function Card({
  children,
  padding = 4,
  gap = 3,
  tone = "default",
  elevation = "flat",
  onPress,
  label,
  style,
}: CardProps) {
  const c = useNoorTheme();
  const s: ViewStyle = {
    gap: space[gap],
    padding: space[padding],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: tone === "accent" ? c.accent : c.border,
    backgroundColor: tone === "soft" ? c.accentSoft : c.bgElev,
    ...(elevation !== "flat" && nativeShadow(elevation)),
  };
  if (onPress)
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [s, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  return <View style={[s, style]}>{children}</View>;
}
