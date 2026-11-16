import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";
import { nativeText, radius, segment, space } from "./scale";

type SegOption = string | { value: string; label: string };

interface SegProps {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}

export function Seg({ options, value, onChange, size = "md" }: SegProps) {
  const c = useNoorTheme();
  const z = segment[size];
  const py = space[z.padY];
  const px = space[z.padX];

  return (
    <View
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
                nativeText(z.text),
                { color: active ? c.ink : c.muted, fontWeight: active ? "700" : "500" },
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
