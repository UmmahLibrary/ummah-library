import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { ToolsListScreen } from "../screens/ToolsListScreen";
import { TasbihScreen } from "../screens/TasbihScreen";
import { AdhkarScreen } from "../screens/AdhkarScreen";
import { PrayerTimesScreen } from "../screens/PrayerTimesScreen";
import { PrayerTrackerScreen } from "../screens/PrayerTrackerScreen";
import { QiblaScreen } from "../screens/QiblaScreen";
import { HijriCalendarScreen } from "../screens/HijriCalendarScreen";
import { ZakatScreen } from "../screens/ZakatScreen";
import { RamadanScreen } from "../screens/RamadanScreen";
import type { ToolsStackParamList } from "./types";

const Stack = createNativeStackNavigator<ToolsStackParamList>();

export function ToolsStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.fg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="ToolsList" component={ToolsListScreen} options={{ title: "Tools" }} />
      <Stack.Screen name="Tasbih" component={TasbihScreen} options={{ title: "Tasbih" }} />
      <Stack.Screen name="Adhkar" component={AdhkarScreen} options={{ title: "Adhkar" }} />
      <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} options={{ title: "Prayer Times" }} />
      <Stack.Screen name="PrayerTracker" component={PrayerTrackerScreen} options={{ title: "Prayer Tracker" }} />
      <Stack.Screen name="Qibla" component={QiblaScreen} options={{ title: "Qibla" }} />
      <Stack.Screen name="HijriCalendar" component={HijriCalendarScreen} options={{ title: "Hijri Calendar" }} />
      <Stack.Screen name="Zakat" component={ZakatScreen} options={{ title: "Zakat Calculator" }} />
      <Stack.Screen name="Ramadan" component={RamadanScreen} options={{ title: "Ramadan" }} />
    </Stack.Navigator>
  );
}
