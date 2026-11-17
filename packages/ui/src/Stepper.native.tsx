import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { radius, space, target, type Script } from "./scale";
import { Text } from "./Text";

export interface StepperProps {
  label: ReactNode;
  value: ReactNode;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease?: boolean;
  canIncrease?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  size?: number;
  script?: Script;
}

/** A labelled − value + control (ADR 0042), matching the web stepper. */
export function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  canDecrease = true,
  canIncrease = true,
  decreaseLabel,
  increaseLabel,
  size = target.default,
  script,
}: StepperProps) {
  const c = useNoorTheme();
  const rtl = script !== undefined && script !== "latin";
  const button = (sign: string, onPress: () => void, enabled: boolean, a11y: string) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !enabled }}
      style={{
        minWidth: size,
        minHeight: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bg,
        opacity: enabled ? 1 : 0.4,
      }}
    >
      <Text role="title" style={{ fontSize: 22, lineHeight: 26 }}>
        {sign}
      </Text>
    </Pressable>
  );
  return (
    <View
      style={{
        flexDirection: rtl ? "row-reverse" : "row",
        direction: "ltr",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space[3],
        flexWrap: "wrap",
      }}
    >
      <Text role="subheading" script={script} style={{ flexShrink: 1 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: rtl ? "row-reverse" : "row",
          direction: "ltr",
          alignItems: "center",
          gap: space[2.5],
        }}
      >
        {button("−", onDecrease, canDecrease, decreaseLabel)}
        <View accessibilityLiveRegion="polite" style={{ minWidth: 56 }}>
          <Text role="subheading" align="center" style={{ fontVariant: ["tabular-nums"] }}>
            {value}
          </Text>
        </View>
        {button("+", onIncrease, canIncrease, increaseLabel)}
      </View>
    </View>
  );
}
