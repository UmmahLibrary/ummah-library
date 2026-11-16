import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useChromeFont, useRtlHeaderOptions } from "./header-direction";
import { useT } from "../i18n/I18nProvider";
import { MoreHubScreen } from "../screens/HubScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TasbihScreen } from "../screens/TasbihScreen";
import { HijriCalendarScreen } from "../screens/HijriCalendarScreen";
import { ZakatScreen } from "../screens/ZakatScreen";
import { DownloadsScreen } from "../screens/DownloadsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import type { MoreStackParamList } from "./types";

const Stack = createNativeStackNavigator<MoreStackParamList>();

/** The More tab (ADR 0042): settings and tools, grouped as on web. */
export function MoreStack() {
  const { colors } = useTheme();
  const rtlHeader = useRtlHeaderOptions();
  const titleFont = useChromeFont();
  const t = useT();
  return (
    <Stack.Navigator
      screenOptions={{
        ...rtlHeader,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.fg, fontFamily: titleFont },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="MoreHub" component={MoreHubScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t("common.settings") }}
      />
      <Stack.Screen
        name="Tasbih"
        component={TasbihScreen}
        options={{ title: t("pr.tool.tasbih") }}
      />
      <Stack.Screen
        name="HijriCalendar"
        component={HijriCalendarScreen}
        options={{ title: t("pr.tool.hijri") }}
      />
      <Stack.Screen name="Zakat" component={ZakatScreen} options={{ title: t("pr.nav.zakat") }} />
      <Stack.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{ title: t("pr.tool.downloads") }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("home.more.journey") }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ title: t("home.more.privacy") }}
      />
    </Stack.Navigator>
  );
}
