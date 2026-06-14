import type { NavigatorScreenParams } from "@react-navigation/native";

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

/** The bottom tabs. */
export type RootTabParamList = {
  Read: NavigatorScreenParams<ReadStackParamList> | undefined;
  Hifz: NavigatorScreenParams<HifzStackParamList> | undefined;
  Names: undefined;
  Hadith: undefined;
  Tools: NavigatorScreenParams<ToolsStackParamList> | undefined;
  Settings: undefined;
};
