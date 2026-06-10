import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../theme";
import { ReadStack } from "./ReadStack";
import { HifzScreen } from "../screens/HifzScreen";
import { HadithScreen } from "../screens/HadithScreen";
import { NamesScreen } from "../screens/NamesScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, string> = {
  Read: "📖",
  Hifz: "🧠",
  Names: "✨",
  Hadith: "📜",
  Settings: "⚙️",
};

export function RootTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.fg,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Read" component={ReadStack} options={{ headerShown: false }} />
      <Tab.Screen name="Hifz" component={HifzScreen} />
      <Tab.Screen name="Names" component={NamesScreen} options={{ title: "99 Names" }} />
      <Tab.Screen name="Hadith" component={HadithScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
