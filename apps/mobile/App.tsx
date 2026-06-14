import { useEffect, useState } from "react";
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
import { ThemeProvider, useTheme } from "./src/theme";
import { SettingsProvider } from "./src/state/SettingsContext";
import { LibraryProvider } from "./src/state/LibraryContext";
import { RootTabs } from "./src/navigation/RootTabs";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { fontMap } from "./src/fonts";
import { KEYS, getString, setString } from "./src/storage";
import type { RootTabParamList } from "./src/navigation/types";

/** URL routes for the web build and OS deep links (ummahlibrary://). */
const linking: LinkingOptions<RootTabParamList> = {
  prefixes: ["ummahlibrary://"],
  config: {
    screens: {
      Home: { screens: { Today: "" } },
      Read: {
        screens: {
          SurahList: "read",
          SurahReader: "surah/:surah",
          JuzReader: "juz/:juz",
          Search: "search",
          Collections: "bookmarks",
          ReadingGoals: "goals",
          MushafPage: "page/:page",
          Tafsir: "tafsir",
          Plans: "plans",
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
        screens: { MoreMenu: "more", Profile: "profile", Settings: "settings", Names: "names", Hadith: "hadith" },
      },
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
    <NavigationContainer theme={navTheme} linking={linking}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <RootTabs />
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
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <LibraryProvider>
            <AppGate />
          </LibraryProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
