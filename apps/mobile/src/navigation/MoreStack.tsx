import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { FONT } from "../fonts";
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.fg, fontFamily: FONT.bold },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Your journey" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="Names" component={NamesScreen} options={{ title: "99 Names" }} />
      <Stack.Screen name="Hadith" component={HadithScreen} options={{ title: "Hadith" }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: "Privacy" }} />
      <Stack.Screen name="Collections" component={CollectionsScreen} options={{ title: "Bookmarks" }} />
      <Stack.Screen name="ReadingGoals" component={ReadingGoalsScreen} options={{ title: "Reading Goals" }} />
      <Stack.Screen name="Tafsir" component={TafsirScreen} options={{ title: "Tafsir" }} />
    </Stack.Navigator>
  );
}
