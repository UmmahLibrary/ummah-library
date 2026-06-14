import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { HifzDashboardScreen } from "../screens/HifzDashboardScreen";
import { HifzReviewScreen } from "../screens/HifzReviewScreen";
import type { HifzStackParamList } from "./types";

const Stack = createNativeStackNavigator<HifzStackParamList>();

export function HifzStack() {
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
      <Stack.Screen
        name="HifzDashboard"
        component={HifzDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HifzReview"
        component={HifzReviewScreen}
        options={{ title: "Review", headerBackTitle: "Hifz" }}
      />
    </Stack.Navigator>
  );
}
