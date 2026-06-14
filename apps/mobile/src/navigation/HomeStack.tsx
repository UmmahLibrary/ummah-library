import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { HomeScreen } from "../screens/HomeScreen";
import type { HomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Today" component={HomeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
