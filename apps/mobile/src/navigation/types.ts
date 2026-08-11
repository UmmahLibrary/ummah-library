import type { NavigatorScreenParams } from "@react-navigation/native";

/** The Home tab's stack: the Today dashboard. */
export type HomeStackParamList = {
  Today: undefined;
};

/** The Read tab's stack: surah list → a surah, or a juzʾ. */
export type ReadStackParamList = {
  SurahList: undefined;
  SurahReader: { surah: number };
  JuzReader: { juz: number };
  Search: undefined;
  MushafPage: { page: number };
  Plans: undefined;
  PlanDetail: { id: string };
};

/** The Hifz tab's stack: memorization dashboard → review session. */
export type HifzStackParamList = {
  HifzDashboard: undefined;
  HifzReview: undefined;
};

/** The Tools tab's stack: tool list → individual tool screens. */
export type ToolsStackParamList = {
  ToolsList: undefined;
  Tasbih: undefined;
  Adhkar: undefined;
  PrayerTimes: undefined;
  PrayerTracker: undefined;
  Qibla: undefined;
  Mosques: undefined;
  HijriCalendar: undefined;
  Zakat: undefined;
  Ramadan: undefined;
  Duas: undefined;
  Downloads: undefined;
};

/** The "More" tab's stack: a menu → secondary sections. */
export type MoreStackParamList = {
  MoreMenu: undefined;
  Profile: undefined;
  Settings: undefined;
  Names: undefined;
  Hadith: undefined;
  Privacy: undefined;
  Collections: undefined;
  ReadingGoals: undefined;
  Tafsir: undefined;
};

/** The bottom tabs — Home · Read · Tools · Memorize · More (Noor mobile design). */
export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Read: NavigatorScreenParams<ReadStackParamList> | undefined;
  Tools: NavigatorScreenParams<ToolsStackParamList> | undefined;
  Memorize: NavigatorScreenParams<HifzStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};

/** The app root: the tab bar, plus a catch-all for unrecognised URLs/deep links (#246). */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  NotFound: undefined;
};
