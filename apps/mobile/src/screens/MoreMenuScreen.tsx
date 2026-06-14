import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import type { MoreStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "MoreMenu">;

export function MoreMenuScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const toRead = (screen: string) => navigation.getParent()?.navigate("Read", { screen } as never);

  const items: { icon: IconName; title: string; desc: string; onPress: () => void }[] = [
    { icon: "star", title: "Your journey", desc: "Streaks, stats & achievements", onPress: () => navigation.navigate("Profile") },
    { icon: "heart", title: "99 Names", desc: "Asmāʾ al-Ḥusná", onPress: () => navigation.navigate("Names") },
    { icon: "globe", title: "Hadith", desc: "Collections of prophetic traditions", onPress: () => navigation.navigate("Hadith") },
    { icon: "tafsir", title: "Tafsir", desc: "Commentary on the Quran", onPress: () => toRead("Tafsir") },
    { icon: "bookmark", title: "Bookmarks", desc: "Saved verses & collections", onPress: () => toRead("Collections") },
    { icon: "check", title: "Reading Goals", desc: "Daily goal, streak & khatma", onPress: () => toRead("ReadingGoals") },
    { icon: "settings", title: "Settings", desc: "Theme, fonts, reciter & data", onPress: () => navigation.navigate("Settings") },
  ];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>More</Text>
      {items.map((it) => (
        <Pressable key={it.title} style={styles.card} onPress={it.onPress} accessibilityRole="button">
          <View style={styles.badge}>
            <Icon name={it.icon} size={20} color={colors.accent} sw={1.8} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{it.title}</Text>
            <Text style={styles.desc}>{it.desc}</Text>
          </View>
          <Icon name="chevR" size={18} color={colors.faint} sw={1.8} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 10, paddingTop: 12 },
    h1: { color: c.fg, fontSize: 26, fontFamily: FONT.extrabold, letterSpacing: -0.5, marginBottom: 6, paddingHorizontal: 2 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
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
