import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme } from "../theme";
import { FONT } from "../fonts";
import { ReadStack } from "./ReadStack";
import { HifzStack } from "./HifzStack";
import { HadithScreen } from "../screens/HadithScreen";
import { NamesScreen } from "../screens/NamesScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ToolsStack } from "./ToolsStack";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, IconName> = {
  Read: "book",
  Hifz: "star",
  Names: "heart",
  Hadith: "globe",
  Tools: "grid",
  Settings: "settings",
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
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 11 },
        headerTitleStyle: { fontFamily: FONT.bold, color: colors.fg },
        tabBarIcon: ({ color }) => <Icon name={ICONS[route.name]} size={22} color={color} sw={1.8} />,
      })}
    >
      <Tab.Screen name="Read" component={ReadStack} options={{ headerShown: false }} />
      <Tab.Screen name="Hifz" component={HifzStack} options={{ headerShown: false }} />
      <Tab.Screen name="Names" component={NamesScreen} options={{ title: "99 Names" }} />
      <Tab.Screen name="Hadith" component={HadithScreen} />
      <Tab.Screen name="Tools" component={ToolsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
