import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type LinkingOptions,
  type Theme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider, useTheme } from "./src/theme";
import { I18nProvider } from "./src/i18n/I18nProvider";
import { SettingsProvider } from "./src/state/SettingsContext";
import { LibraryProvider } from "./src/state/LibraryContext";
import { RootTabs } from "./src/navigation/RootTabs";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { NotFoundScreen } from "./src/screens/NotFoundScreen";
import { fontMap } from "./src/fonts";
import { KEYS, getString, setString } from "./src/storage";
import { initNotifier } from "./src/notifier";
import { syncPlanReminder } from "./src/plan-reminders";
import { syncAdhkarReminder } from "./src/adhkar-reminders";
import { syncPrayerReminders } from "./src/prayer-reminders";
import { syncSunnahFastReminder } from "./src/sunnah-fast-reminders";
import { syncIslamicEventReminders } from "./src/islamic-event-reminders";
import { syncIfEnabled } from "./src/lib/sync/sync-runtime";
import { emitSyncApplied } from "./src/lib/sync/sync-events";
import type { RootStackParamList } from "./src/navigation/types";

const RootStack = createNativeStackNavigator<RootStackParamList>();

/** URL routes for the web build and OS deep links (ummahlibrary://). */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["ummahlibrary://"],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: { screens: { Today: "" } },
          Read: {
            screens: {
              SurahList: "read",
              SurahReader: "surah/:surah",
              JuzReader: "juz/:juz",
              Search: "search",
              MushafPage: "page/:page",
              Plans: "plans",
              PlanDetail: "plans/:id",
            },
          },
          Tools: {
            screens: {
              ToolsList: "tools",
              Tasbih: "tasbih",
              Adhkar: "adhkar",
              PrayerTimes: "prayer-times",
              PrayerTracker: "tracker",
              Qibla: "qibla",
              HijriCalendar: "calendar",
              Zakat: "zakat",
              Ramadan: "ramadan",
              Duas: "duas",
            },
          },
          Memorize: {
            screens: { HifzDashboard: "hifz", HifzReview: "hifz/review" },
          },
          More: {
            screens: {
              MoreMenu: "more",
              Profile: "profile",
              Settings: "settings",
              Names: "names",
              Hadith: "hadith",
              Collections: "bookmarks",
              ReadingGoals: "goals",
              Tafsir: "tafsir",
            },
          },
        },
      },
      // Any URL that doesn't match a screen above (React Navigation's documented
      // catch-all) — without this, an unmatched path resolves to no route and
      // NavigationContainer silently falls back to the initial state (Home).
      NotFound: "*",
    },
  },
};

function NavRoot() {
  const { mode, colors } = useTheme();
  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.bg,
      text: colors.fg,
      border: colors.border,
    },
  };
  return (
    <NavigationContainer
      theme={navTheme}
      linking={linking}
      // On a cold/direct web navigation, linking resolution is async (one paint
      // cycle even though getInitialURL is synchronous) and NavigationContainer
      // renders only this fallback until it resolves — default to a themed
      // placeholder instead of a blank white flash.
      fallback={<View style={{ flex: 1, backgroundColor: colors.bg }} />}
    >
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Tabs" component={RootTabs} />
        <RootStack.Screen
          name="NotFound"
          component={NotFoundScreen}
          options={{ headerShown: true, title: "Not found" }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

/** Show the first-run onboarding until the user finishes it, then the app. */
function AppGate() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => {
    void getString(KEYS.onboarded).then((v) => setOnboarded(v === "1"));
  }, []);
  if (onboarded === null) return null;
  if (!onboarded) {
    return (
      <OnboardingScreen
        onDone={() => {
          void setString(KEYS.onboarded, "1");
          setOnboarded(true);
        }}
      />
    );
  }
  return <NavRoot />;
}

export default function App() {
  const [fontsLoaded] = useFonts(fontMap);

  // Prime the notifier, then keep every reminder family scheduled — re-syncing on
  // foreground so the schedule rolls to the next day after one fires (#71). Also
  // run cross-device sync (#25) on launch and on foreground; it's a no-op unless
  // the user has opted in, and failures (offline/unprovisioned) are swallowed.
  useEffect(() => {
    const syncAll = () => {
      void syncPlanReminder();
      void syncAdhkarReminder();
      void syncPrayerReminders();
      void syncSunnahFastReminder();
      void syncIslamicEventReminders();
      void syncIfEnabled()
        .then((outcome) => {
          // A pulled value landed — re-hydrate the contexts so it shows without a relaunch.
          if (outcome && outcome.applied > 0) emitSyncApplied();
        })
        .catch(() => {});
    };
    void initNotifier().then(syncAll);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") syncAll();
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <SettingsProvider>
            <LibraryProvider>
              <AppGate />
            </LibraryProvider>
          </SettingsProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
