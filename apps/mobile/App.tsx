import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
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

// Keep the native splash up past the first JS frame — otherwise Expo
// auto-hides it as soon as something paints, which for this app is a blank
// screen (fonts + the onboarding-seen check below are both still pending
// async work at that point). AppGate calls hideAsync() once both resolve.
void SplashScreen.preventAutoHideAsync().catch(() => {});

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
  // AppGate only mounts once fonts are already loaded (see App() below), so
  // resolving here is also the signal that every startup gate is clear.
  useEffect(() => {
    if (onboarded !== null) void SplashScreen.hideAsync().catch(() => {});
  }, [onboarded]);
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
  // useFonts resolves `loaded: false` forever if the load ever rejects (a
  // corrupted/missing font asset) — it never becomes `true` on its own after
  // an error. Proceed on `fontError` too so one bad font asset can't freeze
  // the app on the splash screen (SplashScreen.hideAsync() only fires once
  // AppGate mounts, which is gated on this) with no fallback and no way for
  // the user to get past it. A screen falling back to the OS default
  // typeface is far better than an app that never starts.
  const [fontsLoaded, fontError] = useFonts(fontMap);

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

  if (!fontsLoaded && !fontError) return null;
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
