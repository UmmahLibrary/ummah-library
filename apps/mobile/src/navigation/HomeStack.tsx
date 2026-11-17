import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useRtlHeaderOptions } from "./header-direction";
import { useT } from "../i18n/I18nProvider";
import { HomeScreen } from "../screens/HomeScreen";
import type { HomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { colors } = useTheme();
  const rtlHeader = useRtlHeaderOptions();
  const t = useT();
  return (
    <Stack.Navigator
      screenOptions={{
        ...rtlHeader,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="Today"
        component={HomeScreen}
        options={{ headerShown: false, title: t("home.today") }}
      />
    </Stack.Navigator>
  );
}
