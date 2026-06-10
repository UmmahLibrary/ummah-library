import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme, type Palette } from "../theme";
import type { ToolsStackParamList } from "../navigation/types";

const TOOLS: { screen: keyof ToolsStackParamList; icon: string; title: string; desc: string }[] = [
  { screen: "Tasbih",       icon: "📿", title: "Tasbih",         desc: "Digital dhikr counter" },
  { screen: "Adhkar",       icon: "🌅", title: "Adhkar",         desc: "Morning & evening remembrances" },
  { screen: "PrayerTimes",  icon: "🕌", title: "Prayer Times",   desc: "Daily salah times for your location" },
  { screen: "Qibla",        icon: "🕋", title: "Qibla",          desc: "Direction of the Kaaba" },
  { screen: "HijriCalendar",icon: "📅", title: "Hijri Calendar", desc: "Islamic lunar calendar" },
  { screen: "Zakat",        icon: "💰", title: "Zakat",          desc: "Estimate your annual zakat" },
];

type Props = NativeStackScreenProps<ToolsStackParamList, "ToolsList">;

export function ToolsListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {TOOLS.map((t) => (
        <Pressable
          key={t.screen}
          style={styles.card}
          onPress={() => navigation.navigate(t.screen as never)}
          accessibilityRole="button"
        >
          <Text style={styles.icon}>{t.icon}</Text>
          <View style={styles.text}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.desc}>{t.desc}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 10 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 14,
    },
    icon: { fontSize: 26 },
    text: { flex: 1, gap: 2 },
    title: { color: c.fg, fontSize: 15, fontWeight: "600" },
    desc: { color: c.muted, fontSize: 13 },
    arrow: { color: c.muted, fontSize: 20 },
  });
}
