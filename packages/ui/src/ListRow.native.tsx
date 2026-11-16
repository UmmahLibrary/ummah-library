import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { Icon } from "./Icon";
import { iconSize, space, target, type Script } from "./scale";
import { Text } from "./Text";

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  /** Ignored on native — navigate in `onPress`. */
  href?: string;
  divider?: boolean;
  label?: string;
  selected?: boolean;
  /** Arabic script also lays the row out right to left. */
  script?: Script;
  style?: StyleProp<ViewStyle>;
}

/** One row of a list (ADR 0042), matching the web row. */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron,
  onPress,
  divider,
  label,
  selected,
  script,
  style,
}: ListRowProps) {
  const c = useNoorTheme();
  const rtl = script !== undefined && script !== "latin";
  const s: ViewStyle = {
    flexDirection: rtl ? "row-reverse" : "row",
    direction: "ltr",
    alignItems: "center",
    gap: space[3],
    minHeight: target.default,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderBottomWidth: divider ? 1 : 0,
    borderBottomColor: c.borderSoft,
  };
  const body = (
    <>
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: space[0.5] }}>
        <Text role="subheading" script={script} tone={selected ? "accent" : "fg"}>
          {title}
        </Text>
        {subtitle ? (
          <Text role="label" tone="muted" script={script}>
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
