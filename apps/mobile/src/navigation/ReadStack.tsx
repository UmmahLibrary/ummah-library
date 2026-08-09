import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { SurahListScreen } from "../screens/SurahListScreen";
import { SurahReaderScreen } from "../screens/SurahReaderScreen";
import { JuzReaderScreen } from "../screens/JuzReaderScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { MushafPageScreen } from "../screens/MushafPageScreen";
import { PlansScreen } from "../screens/PlansScreen";
import { PlanDetailScreen } from "../screens/PlanDetailScreen";
import type { ReadStackParamList } from "./types";

const Stack = createNativeStackNavigator<ReadStackParamList>();

export function ReadStack() {
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
      <Stack.Screen name="SurahList" component={SurahListScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SurahReader"
        component={SurahReaderScreen}
        options={{ title: "", headerBackTitle: "Surahs" }}
      />
      <Stack.Screen
        name="JuzReader"
        component={JuzReaderScreen}
        options={({ route }) => ({ title: `Juzʾ ${route.params.juz}` })}
      />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Stack.Screen
        name="MushafPage"
        component={MushafPageScreen}
        options={{ title: "", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="Plans" component={PlansScreen} options={{ title: "Reading Plans" }} />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ title: "Plan", headerBackTitle: "Plans" }} />
    </Stack.Navigator>
  );
}
