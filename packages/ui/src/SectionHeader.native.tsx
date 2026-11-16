import type { ReactNode } from "react";
import { View } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { Icon, type IconName } from "./Icon";
import { iconSize, radius, space, type Script } from "./scale";
import { Text } from "./Text";

export interface SectionHeaderProps {
  title: ReactNode;
  note?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  id?: string;
  level?: 2 | 3;
  script?: Script;
}

/** Section heading (ADR 0042), matching the web: icon tile, title, purpose. */
export function SectionHeader({ title, note, icon, action, script }: SectionHeaderProps) {
  const c = useNoorTheme();
  const rtl = script !== undefined && script !== "latin";
  return (
    <View
      style={{
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        gap: space[3],
        direction: "ltr",
      }}
    >
      {icon && (
        <View
          accessible={false}
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: c.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={iconSize.md} color={c.accent} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0, gap: space[0.5] }}>
        <Text role="heading" header script={script}>
          {title}
        </Text>
        {note ? (
          <Text role="bodySm" tone="muted" script={script}>
            {note}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
