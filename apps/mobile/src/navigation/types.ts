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
  Collections: undefined;
  ReadingGoals: undefined;
  MushafPage: { page: number };
  Tafsir: undefined;
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
  HijriCalendar: undefined;
  Zakat: undefined;
};

/** The "More" tab's stack: a menu → secondary sections. */
export type MoreStackParamList = {
  MoreMenu: undefined;
  Settings: undefined;
  Names: undefined;
  Hadith: undefined;
};

/** The bottom tabs — Home · Read · Tools · Memorize · More (Noor mobile design). */
export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Read: NavigatorScreenParams<ReadStackParamList> | undefined;
  Tools: NavigatorScreenParams<ToolsStackParamList> | undefined;
  Memorize: NavigatorScreenParams<HifzStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};
