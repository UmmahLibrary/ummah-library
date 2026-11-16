import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { Icon, type IconName } from "./Icon";
import { iconSize, radius, space, target, type Script } from "./scale";
import { Text } from "./Text";

export interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  /** Ignored on native — navigate in `onPress`. */
  href?: string;
  /** Ignored on native. */
  linkAs?: unknown;
  icon?: IconName;
  label?: string;
  lang?: string;
  /** Script of the label, for its face (e.g. a chip that says "العربية"). */
  script?: Script;
  style?: StyleProp<ViewStyle>;
}

/** A pill for filters and choices (ADR 0042), matching the web chip. */
export function Chip({ children, selected, onPress, icon, label, script, style }: ChipProps) {
  const c = useNoorTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: space[1.5],
          minHeight: target.min,
          paddingHorizontal: space[4],
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: selected ? c.accent : c.border,
          backgroundColor: selected ? c.accentSoft : c.bgElev,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={iconSize.sm} color={selected ? c.accent : c.fg} />}
      <Text role="label" tone={selected ? "accent" : "fg"} script={script}>
        {children}
      </Text>
    </Pressable>
  );
}
