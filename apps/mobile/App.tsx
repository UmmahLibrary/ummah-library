import { Text, TextInput } from "react-native";
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
import { fontMap, FONT } from "./src/fonts";
import type { RootTabParamList } from "./src/navigation/types";

// Default every Text/TextInput to the Noor UI font; styles that need a weight or
// Arabic set `fontFamily` explicitly (see src/fonts.ts).
const withDefaultFont = (Component: typeof Text | typeof TextInput) => {
  const c = Component as unknown as { defaultProps?: { style?: unknown } };
  c.defaultProps = { ...c.defaultProps, style: [{ fontFamily: FONT.regular }, c.defaultProps?.style] };
};
withDefaultFont(Text);
withDefaultFont(TextInput);

/** URL routes for the web build and OS deep links (ummahlibrary://). */
const linking: LinkingOptions<RootTabParamList> = {
  prefixes: ["ummahlibrary://"],
  config: {
    screens: {
      Read: {
        screens: {
          SurahList: "",
          SurahReader: "surah/:surah",
          JuzReader: "juz/:juz",
          Search: "search",
          Collections: "bookmarks",
        },
      },
      Hifz: {
        screens: { HifzDashboard: "hifz", HifzReview: "hifz/review" },
      },
      Names: "names",
      Hadith: "hadith",
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
        },
      },
      Settings: "settings",
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

export default function App() {
  const [fontsLoaded] = useFonts(fontMap);
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <LibraryProvider>
            <NavRoot />
          </LibraryProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
