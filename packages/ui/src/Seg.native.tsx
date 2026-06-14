import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNoorTheme } from "./NoorThemeContext";

type SegOption = string | { value: string; label: string };

interface SegProps {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}

export function Seg({ options, value, onChange, size = "md" }: SegProps) {
  const c = useNoorTheme();
  const py = size === "sm" ? 6 : 8;
  const px = size === "sm" ? 12 : 15;
  const fs = size === "sm" ? 13 : 14;

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: c.border, backgroundColor: c.bgElev },
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
            style={[
              styles.item,
              { paddingVertical: py, paddingHorizontal: px },
              { backgroundColor: active ? c.accent : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.label,
                { fontSize: fs },
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
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: { flex: 1, alignItems: "center" },
  label: {},
});
