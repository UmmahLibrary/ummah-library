import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme } from "../theme";
import { useT } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
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

const LABEL_KEYS: Record<keyof RootTabParamList, MessageKey> = {
  Home: "tab.home",
  Read: "tab.read",
  Tools: "tab.tools",
  Memorize: "tab.memorize",
  More: "tab.more",
};

export function RootTabs() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 11 },
        tabBarIcon: ({ color }) => <Icon name={ICONS[route.name]} size={22} color={color} sw={1.8} />,
        tabBarLabel: t(LABEL_KEYS[route.name]),
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
