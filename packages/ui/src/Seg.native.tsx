import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { nativeText, radius, segment, space, type Script } from "./scale";
import { nativeFamily } from "./native-fonts";

type SegOption = string | { value: string; label: string };

interface SegProps {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  /** Script of the labels, for their face (Urdu → Nastaʿlīq). */
  script?: Script;
  /** Names the group for assistive tech; mirrors the web prop. */
  ariaLabel?: string;
}

export function Seg({
  options,
  value,
  onChange,
  size = "md",
  script = "latin",
  ariaLabel,
}: SegProps) {
  const c = useNoorTheme();
  const z = segment[size];
  const py = space[z.padY];
  const px = space[z.padX];

  return (
    <View
      accessibilityLabel={ariaLabel}
      style={[
        styles.wrap,
        { borderColor: c.border, backgroundColor: c.bgElev, borderRadius: radius[z.radius] },
      ]}
    >
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const active = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.item,
              { paddingVertical: py, paddingHorizontal: px },
              { backgroundColor: active ? c.accent : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.label,
                nativeText(z.text, script),
                {
                  color: active ? c.ink : c.muted,
                  fontFamily: nativeFamily(active ? 700 : 500, script),
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1,
    overflow: "hidden",
  },
  item: { flex: 1, alignItems: "center" },
  label: {},
});
