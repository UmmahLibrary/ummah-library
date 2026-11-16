import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useChromeFont, useRtlHeaderOptions } from "./header-direction";
import { useT } from "../i18n/I18nProvider";
import { PrayerHubScreen } from "../screens/HubScreen";
import { PrayerTimesScreen } from "../screens/PrayerTimesScreen";
import { PrayerTrackerScreen } from "../screens/PrayerTrackerScreen";
import { QiblaScreen } from "../screens/QiblaScreen";
import { MosqueFinderScreen } from "../screens/MosqueFinderScreen";
import { RamadanScreen } from "../screens/RamadanScreen";
import type { PrayerStackParamList } from "./types";

const Stack = createNativeStackNavigator<PrayerStackParamList>();

/** The Prayer tab (ADR 0042), grouped as on web. */
export function PrayerStack() {
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
      <Stack.Screen name="PrayerHub" component={PrayerHubScreen} options={{ headerShown: false }} />
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
        name="Ramadan"
        component={RamadanScreen}
        options={{ title: t("pr.tool.ramadan") }}
      />
    </Stack.Navigator>
  );
}
