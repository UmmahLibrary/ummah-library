import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "../Type";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";

/**
 * A labelled control (ADR 0041): an icon with a visible word underneath (or
 * beside it), never an icon alone. At least 48dp tall (56 with Larger buttons,
 * 64 in Easy mode), label ≥ 13sp in `fg`/`muted` — both clear 4.5:1 on every
 * Noor theme. "On" is shown by the accent border/fill and icon, not by
 * recolouring the label (accent text is under 4.5:1 on the light themes).
 */
export function LabelButton({
  icon,
  label,
  onPress,
  active = false,
  disabled = false,
  row = false,
  accessibilityLabel,
  accessibilityRole = "button",
  style,
  children,
}: {
  icon?: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  /** Icon beside the word instead of above it. */
  row?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "switch";
  style?: StyleProp<ViewStyle>;
  /** Replaces the icon (e.g. a spinner or a "1.25×" value). */
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const { comfort } = useSettings();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        accessibilityRole === "switch"
          ? { checked: active, disabled }
          : { selected: active, disabled }
      }
      style={({ pressed }) => [
        styles.btn,
        row && styles.btnRow,
        { minHeight: min, minWidth: row ? min : Math.max(56, min) },
        active && styles.btnOn,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children ??
        (icon ? (
          <Icon name={icon} size={20} color={active ? colors.accent : colors.fg} sw={1.8} />
        ) : null)}
      <View>
        <Text style={[styles.label, active && styles.labelOn]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    btn: {
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    btnRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14 },
    btnOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.45 },
    label: { color: c.fg, fontSize: 13, fontFamily: FONT.semibold },
    labelOn: { fontFamily: FONT.bold },
  });
}
