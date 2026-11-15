import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useRtlHeaderOptions } from "./header-direction";
import { FONT } from "../fonts";
import { useT } from "../i18n/I18nProvider";
import { MoreMenuScreen } from "../screens/MoreMenuScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { NamesScreen } from "../screens/NamesScreen";
import { HadithScreen } from "../screens/HadithScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import { CollectionsScreen } from "../screens/CollectionsScreen";
import { ReadingGoalsScreen } from "../screens/ReadingGoalsScreen";
import { TafsirScreen } from "../screens/TafsirScreen";
import type { MoreStackParamList } from "./types";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  const { colors } = useTheme();
  const rtlHeader = useRtlHeaderOptions();
  const t = useT();
  return (
    <Stack.Navigator
      screenOptions={{
        ...rtlHeader,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.fg, fontFamily: FONT.bold },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ headerShown: false, title: t("tab.more") }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("home.more.journey") }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t("common.settings") }}
      />
      <Stack.Screen
        name="Names"
        component={NamesScreen}
        options={{ title: t("home.more.names") }}
      />
      <Stack.Screen
        name="Hadith"
        component={HadithScreen}
        options={{ title: t("home.more.hadith") }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ title: t("home.more.privacy") }}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{ title: t("home.more.bookmarks") }}
      />
      <Stack.Screen
        name="ReadingGoals"
        component={ReadingGoalsScreen}
        options={{ title: t("home.more.goals") }}
      />
      <Stack.Screen
        name="Tafsir"
        component={TafsirScreen}
        options={{ title: t("home.more.tafsir") }}
      />
    </Stack.Navigator>
  );
}
