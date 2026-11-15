import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import type { ToolsStackParamList } from "../navigation/types";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

const TOOLS: {
  screen: keyof ToolsStackParamList;
  icon: IconName;
  title: MessageKey;
  desc: MessageKey;
}[] = [
  { screen: "Tasbih", icon: "repeat", title: "pr.tool.tasbih", desc: "pr.toolDesc.tasbih" },
  { screen: "Adhkar", icon: "sun", title: "pr.tool.adhkar", desc: "pr.toolDesc.adhkar" },
  { screen: "Duas", icon: "heart", title: "pr.tool.duas", desc: "pr.toolDesc.duas" },
  {
    screen: "PrayerTimes",
    icon: "home",
    title: "pr.tool.prayerTimes",
    desc: "pr.toolDesc.prayerTimes",
  },
  {
    screen: "PrayerTracker",
    icon: "check",
    title: "pr.tool.prayerTracker",
    desc: "pr.toolDesc.prayerTracker",
  },
  { screen: "Qibla", icon: "compass", title: "pr.tool.qibla", desc: "pr.toolDesc.qibla" },
  { screen: "Mosques", icon: "route", title: "pr.tool.mosques", desc: "pr.toolDesc.mosques" },
  { screen: "HijriCalendar", icon: "moon", title: "pr.tool.hijri", desc: "pr.toolDesc.hijri" },
  { screen: "Ramadan", icon: "star", title: "pr.tool.ramadan", desc: "pr.toolDesc.ramadan" },
  { screen: "Zakat", icon: "layers", title: "pr.tool.zakat", desc: "pr.toolDesc.zakat" },
  {
    screen: "Downloads",
    icon: "download",
    title: "pr.tool.downloads",
    desc: "pr.toolDesc.downloads",
  },
];

type Props = NativeStackScreenProps<ToolsStackParamList, "ToolsList">;

export function ToolsListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, dir } = useIntl();

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {TOOLS.map((tool) => (
        <Pressable
          key={tool.screen}
          style={styles.card}
          onPress={() => navigation.navigate(tool.screen as never)}
          accessibilityRole="button"
        >
          <View style={styles.badge}>
            <Icon name={tool.icon} size={20} color={colors.accent} sw={1.8} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{t(tool.title)}</Text>
            <Text style={styles.desc}>{t(tool.desc)}</Text>
          </View>
          <Icon name={dir === "rtl" ? "chevL" : "chevR"} size={18} color={colors.faint} sw={1.8} />
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
