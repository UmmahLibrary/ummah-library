import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import type { ToolsStackParamList } from "../navigation/types";

const TOOLS: { screen: keyof ToolsStackParamList; icon: IconName; title: string; desc: string }[] = [
  { screen: "Tasbih",        icon: "repeat",  title: "Tasbih",         desc: "Digital dhikr counter" },
  { screen: "Adhkar",        icon: "sun",     title: "Adhkar",         desc: "Morning & evening remembrances" },
  { screen: "Duas",          icon: "heart",   title: "Duʿās",          desc: "Qurʾānic supplications by moment" },
  { screen: "PrayerTimes",   icon: "home",    title: "Prayer Times",   desc: "Daily salah times for your location" },
  { screen: "PrayerTracker", icon: "check",   title: "Prayer Tracker", desc: "Log your five daily prayers & streak" },
  { screen: "Qibla",         icon: "compass", title: "Qibla",          desc: "Direction of the Kaaba" },
  { screen: "HijriCalendar", icon: "moon",    title: "Hijri Calendar", desc: "Islamic lunar calendar" },
  { screen: "Ramadan",       icon: "star",    title: "Ramadan",        desc: "Ifṭār countdown & fasting tracker" },
  { screen: "Zakat",         icon: "layers",  title: "Zakat",          desc: "Estimate your annual zakat" },
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
          <View style={styles.badge}>
            <Icon name={t.icon} size={20} color={colors.accent} sw={1.8} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.desc}>{t.desc}</Text>
          </View>
          <Icon name="chevR" size={18} color={colors.faint} sw={1.8} />
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
    badge: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    text: { flex: 1, gap: 2 },
    title: { color: c.fg, fontSize: 15, fontFamily: FONT.semibold },
    desc: { color: c.muted, fontSize: 13 },
  });
}
