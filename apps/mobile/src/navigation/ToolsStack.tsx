import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useRtlHeaderOptions } from "./header-direction";
import { useT } from "../i18n/I18nProvider";
import { ToolsListScreen } from "../screens/ToolsListScreen";
import { TasbihScreen } from "../screens/TasbihScreen";
import { AdhkarScreen } from "../screens/AdhkarScreen";
import { PrayerTimesScreen } from "../screens/PrayerTimesScreen";
import { PrayerTrackerScreen } from "../screens/PrayerTrackerScreen";
import { QiblaScreen } from "../screens/QiblaScreen";
import { MosqueFinderScreen } from "../screens/MosqueFinderScreen";
import { HijriCalendarScreen } from "../screens/HijriCalendarScreen";
import { ZakatScreen } from "../screens/ZakatScreen";
import { RamadanScreen } from "../screens/RamadanScreen";
import { DuasScreen } from "../screens/DuasScreen";
import { DownloadsScreen } from "../screens/DownloadsScreen";
import type { ToolsStackParamList } from "./types";

const Stack = createNativeStackNavigator<ToolsStackParamList>();

export function ToolsStack() {
  const { colors } = useTheme();
  const rtlHeader = useRtlHeaderOptions();
  const t = useT();
  return (
    <Stack.Navigator
      screenOptions={{
        ...rtlHeader,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.fg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="ToolsList"
        component={ToolsListScreen}
        options={{ title: t("tab.tools") }}
      />
      <Stack.Screen
        name="Tasbih"
        component={TasbihScreen}
        options={{ title: t("pr.tool.tasbih") }}
      />
      <Stack.Screen
        name="Adhkar"
        component={AdhkarScreen}
        options={{ title: t("pr.tool.adhkar") }}
      />
      <Stack.Screen
        name="PrayerTimes"
        component={PrayerTimesScreen}
        options={{ title: t("pr.tool.prayerTimes") }}
      />
      <Stack.Screen
        name="PrayerTracker"
        component={PrayerTrackerScreen}
        options={{ title: t("pr.tool.prayerTracker") }}
      />
      <Stack.Screen name="Qibla" component={QiblaScreen} options={{ title: t("pr.tool.qibla") }} />
      <Stack.Screen
        name="Mosques"
        component={MosqueFinderScreen}
        options={{ title: t("pr.tool.mosques") }}
      />
      <Stack.Screen
        name="HijriCalendar"
        component={HijriCalendarScreen}
        options={{ title: t("pr.tool.hijri") }}
      />
      <Stack.Screen name="Zakat" component={ZakatScreen} options={{ title: t("pr.nav.zakat") }} />
      <Stack.Screen
        name="Ramadan"
        component={RamadanScreen}
        options={{ title: t("pr.tool.ramadan") }}
      />
      <Stack.Screen name="Duas" component={DuasScreen} options={{ title: t("pr.tool.duas") }} />
      <Stack.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{ title: t("pr.tool.downloads") }}
      />
    </Stack.Navigator>
  );
}
