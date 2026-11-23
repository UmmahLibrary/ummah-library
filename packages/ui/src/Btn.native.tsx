import { Pressable, StyleSheet, Text } from "react-native";
import type { ReactNode } from "react";
import { useNoorTheme } from "./NoorThemeContext";
import { Icon, type IconName } from "./Icon";
import { control, iconSize, nativeText, radius, space } from "./scale";

type BtnVariant = "gold" | "ghost" | "soft" | "quiet";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  children?: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  onClick?: () => void;
  icon?: IconName;
  disabled?: boolean;
  /** Ignored on native — type attribute is web-only. */
  type?: "button" | "submit" | "reset";
  /** Accessible name — needed for an icon-only button; mirrors the web prop. */
  ariaLabel?: string;
}

export function Btn({
  children,
  variant = "gold",
  size = "md",
  onClick,
  icon,
  disabled,
  ariaLabel,
}: BtnProps) {
  const c = useNoorTheme();
  const z = control[size];

  const variantStyle = StyleSheet.create({
    v: {
      gold: { backgroundColor: c.accent, borderColor: "transparent" },
      ghost: { backgroundColor: c.bgElev, borderColor: c.border },
      soft: { backgroundColor: c.accentSoft, borderColor: c.accent },
      quiet: { backgroundColor: "transparent", borderColor: "transparent" },
    }[variant] as object,
  }).v;

  const textColor: string =
    variant === "gold"
      ? c.ink
      : variant === "soft"
        ? c.accent
        : variant === "quiet"
          ? c.muted
          : c.fg;

  return (
    <Pressable
      onPress={onClick}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      style={[
        styles.base,
        {
          paddingVertical: space[z.padY],
          paddingHorizontal: space[z.padX],
          borderRadius: radius[z.radius],
        },
        variantStyle,
        disabled && styles.disabled,
      ]}
    >
      {icon && <Icon name={icon} size={iconSize[z.icon]} color={textColor} />}
      <Text style={[styles.label, nativeText(z.text), { color: textColor }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
    borderWidth: 1,
  },
  label: { fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
