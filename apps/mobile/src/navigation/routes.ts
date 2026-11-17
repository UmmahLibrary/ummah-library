import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { IconName } from "@ummahlibrary/ui";
import type { MessageKey } from "../i18n/messages";
import type {
  LearnStackParamList,
  MoreStackParamList,
  PrayerStackParamList,
  ReadStackParamList,
  RootTabParamList,
} from "./types";

type AnyScreen =
  | keyof ReadStackParamList
  | keyof PrayerStackParamList
  | keyof LearnStackParamList
  | keyof MoreStackParamList
  | "Today";

/** Which tab owns each screen — the same groups as web's `lib/nav.ts`. */
export const TAB_OF: Record<AnyScreen, keyof RootTabParamList> = {
  Today: "Home",
  SurahList: "Read",
  SurahReader: "Read",
  JuzReader: "Read",
  Search: "Read",
  MushafPage: "Read",
  Plans: "Read",
  PlanDetail: "Read",
  HifzDashboard: "Read",
  HifzReview: "Read",
  ReadingGoals: "Read",
  Collections: "Read",
  Tafsir: "Read",
  PrayerHub: "Prayer",
  PrayerTimes: "Prayer",
  PrayerTracker: "Prayer",
  Qibla: "Prayer",
  Mosques: "Prayer",
  Ramadan: "Prayer",
  LearnHub: "Learn",
  Duas: "Learn",
  Adhkar: "Learn",
  Hadith: "Learn",
  Names: "Learn",
  MoreHub: "More",
  Settings: "More",
  Tasbih: "More",
  HijriCalendar: "More",
  Zakat: "More",
  Downloads: "More",
  Profile: "More",
  Privacy: "More",
};

/**
 * Open any screen from anywhere: switches to the tab that owns it, then pushes
 * the screen in that tab's stack. `navigation` is a stack screen's navigation.
 */
export function goTo(
  navigation: NavigationProp<ParamListBase>,
  screen: AnyScreen,
  params?: object,
): void {
  const tab = TAB_OF[screen];
  const tabs = navigation.getParent() ?? navigation;
  tabs.navigate(tab, { screen, ...(params ? { params } : {}) } as never);
}

export interface HubItem {
  screen: AnyScreen;
  icon: IconName;
  title: MessageKey;
  note: MessageKey;
}

/** The hub pages' tiles, in web's order. */
export const HUBS: Record<"Prayer" | "Learn" | "More", HubItem[]> = {
  Prayer: [
    {
      screen: "PrayerTimes",
      icon: "home",
      title: "pr.tool.prayerTimes",
      note: "pr.toolDesc.prayerTimes",
    },
    {
      screen: "PrayerTracker",
      icon: "check",
      title: "pr.tool.prayerTracker",
      note: "pr.toolDesc.prayerTracker",
    },
    { screen: "Qibla", icon: "compass", title: "pr.tool.qibla", note: "pr.toolDesc.qibla" },
    { screen: "Ramadan", icon: "moon", title: "pr.tool.ramadan", note: "pr.toolDesc.ramadan" },
    { screen: "Mosques", icon: "route", title: "pr.tool.mosques", note: "pr.toolDesc.mosques" },
  ],
  Learn: [
    { screen: "Duas", icon: "hands", title: "pr.tool.duas", note: "pr.toolDesc.duas" },
    { screen: "Adhkar", icon: "repeat", title: "pr.tool.adhkar", note: "pr.toolDesc.adhkar" },
    { screen: "Hadith", icon: "globe", title: "home.more.hadith", note: "home.more.hadithDesc" },
    { screen: "Names", icon: "grid", title: "home.more.names", note: "home.more.namesDesc" },
  ],
  More: [
    {
      screen: "Settings",
      icon: "settings",
      title: "common.settings",
      note: "home.more.settingsDesc",
    },
    { screen: "Tasbih", icon: "more", title: "pr.tool.tasbih", note: "pr.toolDesc.tasbih" },
    { screen: "HijriCalendar", icon: "cal", title: "pr.tool.hijri", note: "pr.toolDesc.hijri" },
    { screen: "Zakat", icon: "layers", title: "pr.tool.zakat", note: "pr.toolDesc.zakat" },
    {
      screen: "Downloads",
      icon: "download",
      title: "pr.tool.downloads",
      note: "pr.toolDesc.downloads",
    },
    { screen: "Profile", icon: "user", title: "home.more.journey", note: "home.more.journeyDesc" },
    { screen: "Privacy", icon: "eye", title: "home.more.privacy", note: "home.more.privacyDesc" },
  ],
};

/** Shortcuts under the Quran title (the Quran group's other places). */
export const QURAN_LINKS: { screen: AnyScreen; icon: IconName; title: MessageKey }[] = [
  { screen: "HifzDashboard", icon: "star", title: "tab.memorize" },
  { screen: "Plans", icon: "route", title: "home.more.plans" },
  { screen: "ReadingGoals", icon: "check", title: "home.more.goals" },
  { screen: "Collections", icon: "bookmark", title: "home.more.bookmarks" },
  { screen: "Tafsir", icon: "tafsir", title: "home.more.tafsir" },
];
