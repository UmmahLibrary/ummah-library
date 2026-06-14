import { Pressable, StyleSheet, Text } from "react-native";
import type { ReactNode } from "react";
import { useNoorTheme } from "./NoorThemeContext";
import { Icon, type IconName } from "./Icon";

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
}

const SIZES: Record<BtnSize, { py: number; px: number; fs: number; r: number }> = {
  sm: { py: 7, px: 13, fs: 13.5, r: 9 },
  md: { py: 11, px: 21, fs: 15, r: 11 },
  lg: { py: 14, px: 28, fs: 16, r: 12 },
};

export function Btn({
  children,
  variant = "gold",
  size = "md",
  onClick,
  icon,
  disabled,
}: BtnProps) {
  const c = useNoorTheme();
  const z = SIZES[size];

  const variantStyle = StyleSheet.create({
    v: {
      gold: { backgroundColor: c.accent, borderColor: "transparent" },
      ghost: { backgroundColor: c.bgElev, borderColor: c.border },
      soft: { backgroundColor: c.accentSoft, borderColor: c.accent },
      quiet: { backgroundColor: "transparent", borderColor: "transparent" },
    }[variant] as object,
  }).v;

  const textColor: string =
    variant === "gold" ? c.ink : variant === "soft" ? c.accent : variant === "quiet" ? c.muted : c.fg;

  return (
    <Pressable
      onPress={onClick}
      disabled={disabled}
      style={[
        styles.base,
        { paddingVertical: z.py, paddingHorizontal: z.px, borderRadius: z.r },
        variantStyle,
        disabled && styles.disabled,
      ]}
    >
      {icon && <Icon name={icon} size={z.fs + 3} color={textColor} />}
      <Text style={[styles.label, { fontSize: z.fs, color: textColor }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  label: { fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
