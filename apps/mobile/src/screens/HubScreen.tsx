import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "../Type";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { Icon, ListRow, Text, space } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { HUBS, goTo } from "../navigation/routes";

/**
 * A tab's hub (Prayer, Learn, More), as on web (ADR 0041/0042): the tab's
 * name, a one-line intro, then a labelled tile for each place in it.
 */
export function HubScreen({ hub }: { hub: "Prayer" | "Learn" | "More" }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, script } = useIntl();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const title: MessageKey =
    hub === "Prayer" ? "tab.prayer" : hub === "Learn" ? "tab.learn" : "tab.more";
  const intro: MessageKey =
    hub === "Prayer" ? "hub.prayerIntro" : hub === "Learn" ? "hub.learnIntro" : "hub.moreIntro";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.head}>
        <Text role="display" header script={script}>
          {t(title)}
        </Text>
        <Text role="body" tone="muted" script={script}>
          {t(intro)}
        </Text>
      </View>
      {HUBS[hub].map((item) => (
        <ListRow
          key={item.screen}
          surface="card"
          chevron
          script={script}
          leading={
            <View style={styles.icon}>
              <Icon name={item.icon} size={22} color={colors.accent} sw={1.8} />
            </View>
          }
          title={t(item.title)}
          subtitle={t(item.note)}
          onPress={() => goTo(navigation, item.screen)}
          style={styles.tile}
        />
      ))}
    </ScrollView>
  );
}

export const PrayerHubScreen = () => <HubScreen hub="Prayer" />;
export const LearnHubScreen = () => <HubScreen hub="Learn" />;
export const MoreHubScreen = () => <HubScreen hub="More" />;

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: 16, paddingBottom: 32 },
    head: { gap: space[1], marginBottom: space[5] },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    tile: { minHeight: 76, marginBottom: space[3] },
  });
}
