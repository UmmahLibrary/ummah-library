import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import type { MoreStackParamList } from "../navigation/types";
import { useIntl } from "../i18n/I18nProvider";

type Props = NativeStackScreenProps<MoreStackParamList, "MoreMenu">;

export function MoreMenuScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { t, dir } = useIntl();

  const toRead = (screen: string) => navigation.getParent()?.navigate("Read", { screen } as never);

  const items: { icon: IconName; title: string; desc: string; onPress: () => void }[] = [
    {
      icon: "star",
      title: t("home.more.journey"),
      desc: t("home.more.journeyDesc"),
      onPress: () => navigation.navigate("Profile"),
    },
    {
      icon: "heart",
      title: t("home.more.names"),
      desc: t("home.more.namesDesc"),
      onPress: () => navigation.navigate("Names"),
    },
    {
      icon: "globe",
      title: t("home.more.hadith"),
      desc: t("home.more.hadithDesc"),
      onPress: () => navigation.navigate("Hadith"),
    },
    {
      icon: "tafsir",
      title: t("home.more.tafsir"),
      desc: t("home.more.tafsirDesc"),
      onPress: () => navigation.navigate("Tafsir"),
    },
    {
      icon: "bookmark",
      title: t("home.more.bookmarks"),
      desc: t("home.more.bookmarksDesc"),
      onPress: () => navigation.navigate("Collections"),
    },
    {
      icon: "check",
      title: t("home.more.goals"),
      desc: t("home.more.goalsDesc"),
      onPress: () => navigation.navigate("ReadingGoals"),
    },
    {
      icon: "book",
      title: t("home.more.plans"),
      desc: t("home.more.plansDesc"),
      onPress: () => toRead("Plans"),
    },
    {
      icon: "settings",
      title: t("common.settings"),
      desc: t("home.more.settingsDesc"),
      onPress: () => navigation.navigate("Settings"),
    },
    {
      icon: "eye",
      title: t("home.more.privacy"),
      desc: t("home.more.privacyDesc"),
      onPress: () => navigation.navigate("Privacy"),
    },
  ];

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.h1} accessibilityRole="header">
        {t("tab.more")}
      </Text>
      {items.map((it) => (
        <Pressable
          key={it.title}
          style={styles.card}
          onPress={it.onPress}
          accessibilityRole="button"
        >
          <View style={styles.badge}>
            <Icon name={it.icon} size={20} color={colors.accent} sw={1.8} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{it.title}</Text>
            <Text style={styles.desc}>{it.desc}</Text>
          </View>
          <View style={dir === "rtl" ? { transform: [{ scaleX: -1 }] } : null}>
            <Icon name="chevR" size={18} color={colors.faint} sw={1.8} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 10, paddingTop: 12 },
    h1: {
      color: c.fg,
      fontSize: 26,
      fontFamily: FONT.extrabold,
      letterSpacing: -0.5,
      marginBottom: 6,
      paddingHorizontal: 2,
    },
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
