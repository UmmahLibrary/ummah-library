import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme } from "../theme";
import { useT } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { FONT } from "../fonts";
import { HomeStack } from "./HomeStack";
import { ReadStack } from "./ReadStack";
import { PrayerStack } from "./PrayerStack";
import { LearnStack } from "./LearnStack";
import { MoreStack } from "./MoreStack";
import { useChromeFont } from "./header-direction";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

// The same five places, icons and names as the web tab bar (ADR 0042).
const ICONS: Record<keyof RootTabParamList, IconName> = {
  Home: "home",
  Read: "book",
  Prayer: "compass",
  Learn: "layers",
  More: "menu",
};

const LABEL_KEYS: Record<keyof RootTabParamList, MessageKey> = {
  Home: "tab.today",
  Read: "tab.quran",
  Prayer: "tab.prayer",
  Learn: "tab.learn",
  More: "tab.more",
};

export function RootTabs() {
  const { colors } = useTheme();
  const t = useT();
  const labelFont = useChromeFont("medium");
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        // Nastaʿlīq needs a taller line or its tails clip (ADR 0042).
        tabBarLabelStyle: {
          fontFamily: labelFont,
          fontSize: 11,
          ...(labelFont === FONT.urMedium && { lineHeight: 22 }),
        },
        tabBarIcon: ({ color }) => (
          <Icon name={ICONS[route.name]} size={22} color={color} sw={1.8} />
        ),
        tabBarLabel: t(LABEL_KEYS[route.name]),
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Read" component={ReadStack} />
      <Tab.Screen name="Prayer" component={PrayerStack} />
      <Tab.Screen name="Learn" component={LearnStack} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}
