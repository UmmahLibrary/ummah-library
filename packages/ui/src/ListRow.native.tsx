import type { ReactNode } from "react";
import { Pressable, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { Icon } from "./Icon";
import { iconSize, radius, space, target, type Script } from "./scale";
import { Text } from "./Text";

export type ListRowSurface = "plain" | "card" | "adaptive";

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  /** Ignored on native — navigate in `onPress`. */
  href?: string;
  /** Ignored on native — navigate in `onPress`. */
  linkAs?: unknown;
  surface?: ListRowSurface;
  divider?: boolean;
  label?: string;
  truncate?: boolean;
  selected?: boolean;
  /** Arabic script also lays the row out right to left. */
  script?: Script;
  style?: StyleProp<ViewStyle>;
}

/** Width where adaptive rows become cards (matches the web breakpoint). */
const ADAPTIVE_MIN = 700;

/** One row of a list (ADR 0042), matching the web row. */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron,
  onPress,
  surface = "plain",
  divider,
  label,
  selected,
  truncate,
  script,
  style,
}: ListRowProps) {
  const { width } = useWindowDimensions();
  // Adaptive: a row on phones, a card from 700dp up (ADR 0042), as on web.
  const card = surface === "card" || (surface === "adaptive" && width >= ADAPTIVE_MIN);
  const c = useNoorTheme();
  const rtl = script !== undefined && script !== "latin";
  const s: ViewStyle = {
    flexDirection: rtl ? "row-reverse" : "row",
    direction: "ltr",
    alignItems: "center",
    gap: space[3.5],
    minHeight: target.default,
    paddingVertical: space[3],
    paddingHorizontal: space[card ? 3.5 : 4],
    ...(card
      ? {
          backgroundColor: c.bgElev,
          borderWidth: 1,
          borderColor: selected ? c.accent : c.border,
          borderRadius: radius.md,
          ...(surface === "adaptive" && { marginBottom: space[3] }),
        }
      : {
          borderBottomWidth: divider || surface === "adaptive" ? 1 : 0,
          borderBottomColor: c.borderSoft,
        }),
  };
  const body = (
    <>
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: space[0.5] }}>
        <Text
          role="subheading"
          script={script}
          tone={selected ? "accent" : "fg"}
          numberOfLines={truncate ? 1 : undefined}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text role="label" tone="faint" script={script}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron && <Icon name={rtl ? "chevL" : "chevR"} size={iconSize.md} color={c.faint} />}
    </>
  );
  if (onPress)
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={selected === undefined ? undefined : { selected }}
        style={({ pressed }) => [s, pressed && { backgroundColor: c.cardHi }, style]}
      >
        {body}
      </Pressable>
    );
  return <View style={[s, style]}>{body}</View>;
}
