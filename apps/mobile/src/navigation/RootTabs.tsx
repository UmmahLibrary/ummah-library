import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme } from "../theme";
import { FONT } from "../fonts";
import { HomeStack } from "./HomeStack";
import { ReadStack } from "./ReadStack";
import { ToolsStack } from "./ToolsStack";
import { HifzStack } from "./HifzStack";
import { MoreStack } from "./MoreStack";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, IconName> = {
  Home: "home",
  Read: "book",
  Tools: "grid",
  Memorize: "star",
  More: "menu",
};

export function RootTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 11 },
        tabBarIcon: ({ color }) => <Icon name={ICONS[route.name]} size={22} color={color} sw={1.8} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Read" component={ReadStack} />
      <Tab.Screen name="Tools" component={ToolsStack} />
      <Tab.Screen name="Memorize" component={HifzStack} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}
