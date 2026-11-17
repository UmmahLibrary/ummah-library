import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useChromeFont, useRtlHeaderOptions } from "./header-direction";
import { useT } from "../i18n/I18nProvider";
import { LearnHubScreen } from "../screens/HubScreen";
import { DuasScreen } from "../screens/DuasScreen";
import { AdhkarScreen } from "../screens/AdhkarScreen";
import { HadithScreen } from "../screens/HadithScreen";
import { NamesScreen } from "../screens/NamesScreen";
import type { LearnStackParamList } from "./types";

const Stack = createNativeStackNavigator<LearnStackParamList>();

/** The Learn tab (ADR 0042), grouped as on web. */
export function LearnStack() {
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
      <Stack.Screen name="LearnHub" component={LearnHubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Duas" component={DuasScreen} options={{ title: t("pr.tool.duas") }} />
      <Stack.Screen
        name="Adhkar"
        component={AdhkarScreen}
        options={{ title: t("pr.tool.adhkar") }}
      />
      <Stack.Screen
        name="Hadith"
        component={HadithScreen}
        options={{ title: t("home.more.hadith") }}
      />
      <Stack.Screen
        name="Names"
        component={NamesScreen}
        options={{ title: t("home.more.names") }}
      />
    </Stack.Navigator>
  );
}
