import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useChromeFont, useRtlHeaderOptions } from "./header-direction";
import { SurahListScreen } from "../screens/SurahListScreen";
import { SurahReaderScreen } from "../screens/SurahReaderScreen";
import { JuzReaderScreen } from "../screens/JuzReaderScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { MushafPageScreen } from "../screens/MushafPageScreen";
import { PlansScreen } from "../screens/PlansScreen";
import { PlanDetailScreen } from "../screens/PlanDetailScreen";
import { HifzDashboardScreen } from "../screens/HifzDashboardScreen";
import { HifzReviewScreen } from "../screens/HifzReviewScreen";
import { ReadingGoalsScreen } from "../screens/ReadingGoalsScreen";
import { CollectionsScreen } from "../screens/CollectionsScreen";
import { TafsirScreen } from "../screens/TafsirScreen";
import type { ReadStackParamList } from "./types";
import { useIntl } from "../i18n/I18nProvider";

const Stack = createNativeStackNavigator<ReadStackParamList>();

export function ReadStack() {
  const { colors } = useTheme();
  const rtlHeader = useRtlHeaderOptions();
  const titleFont = useChromeFont();
  const { t, tf } = useIntl();
  return (
    <Stack.Navigator
      screenOptions={{
        ...rtlHeader,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.fg, fontFamily: titleFont },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="SurahList" component={SurahListScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SurahReader"
        component={SurahReaderScreen}
        options={{ title: "", headerBackTitle: t("rd.surahs") }}
      />
      <Stack.Screen
        name="JuzReader"
        component={JuzReaderScreen}
        options={({ route }) => ({ title: tf("rd.juzN", { n: route.params.juz }) })}
      />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: t("rd.search") }} />
      <Stack.Screen
        name="MushafPage"
        component={MushafPageScreen}
        options={{ title: "", headerBackTitle: t("rd.back") }}
      />
      <Stack.Screen
        name="Plans"
        component={PlansScreen}
        options={{ title: t("rd.readingPlans") }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ title: t("rd.plan"), headerBackTitle: t("rd.plans") }}
      />
      {/* The rest of the Quran group, as on web (ADR 0042). The memorization
          dashboard draws its own title, so its header only carries Back. */}
      <Stack.Screen
        name="HifzDashboard"
        component={HifzDashboardScreen}
        options={{ title: "", headerBackTitle: t("rd.surahs") }}
      />
      <Stack.Screen
        name="HifzReview"
        component={HifzReviewScreen}
        options={{ title: t("mem.review.title"), headerBackTitle: t("mem.hifz.title") }}
      />
      <Stack.Screen
        name="ReadingGoals"
        component={ReadingGoalsScreen}
        options={{ title: t("home.more.goals") }}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{ title: t("home.more.bookmarks") }}
      />
      <Stack.Screen
        name="Tafsir"
        component={TafsirScreen}
        options={{ title: t("home.more.tafsir") }}
      />
    </Stack.Navigator>
  );
}
