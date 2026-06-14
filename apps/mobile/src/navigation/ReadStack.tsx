import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { SurahListScreen } from "../screens/SurahListScreen";
import { SurahReaderScreen } from "../screens/SurahReaderScreen";
import { JuzReaderScreen } from "../screens/JuzReaderScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { CollectionsScreen } from "../screens/CollectionsScreen";
import { ReadingGoalsScreen } from "../screens/ReadingGoalsScreen";
import { MushafPageScreen } from "../screens/MushafPageScreen";
import { TafsirScreen } from "../screens/TafsirScreen";
import { PlansScreen } from "../screens/PlansScreen";
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
      <Stack.Screen name="Collections" component={CollectionsScreen} options={{ title: "Bookmarks" }} />
      <Stack.Screen name="ReadingGoals" component={ReadingGoalsScreen} options={{ title: "Reading Goals" }} />
      <Stack.Screen
        name="MushafPage"
        component={MushafPageScreen}
        options={{ title: "", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="Tafsir" component={TafsirScreen} options={{ title: "Tafsir" }} />
      <Stack.Screen name="Plans" component={PlansScreen} options={{ title: "Reading Plans" }} />
    </Stack.Navigator>
  );
}
