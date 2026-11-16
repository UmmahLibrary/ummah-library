import type { NavigatorScreenParams } from "@react-navigation/native";

/**
 * The five places, as on web (ADR 0041/0042): Today · Quran · Prayer · Learn ·
 * More. Each tab is a stack; the groups match web's `lib/nav.ts`.
 */

/** Today: the dashboard. */
export type HomeStackParamList = {
  Today: undefined;
};

/** Quran: surahs, reading, memorization, plans, goals, bookmarks, tafsir. */
export type ReadStackParamList = {
  SurahList: undefined;
  /** `aya` opens at that āyah; `listen` starts the recitation there (Home's "Listen"). */
  SurahReader: { surah: number; aya?: number; listen?: boolean };
  JuzReader: { juz: number };
  Search: undefined;
  MushafPage: { page: number };
  Plans: undefined;
  PlanDetail: { id: string };
  HifzDashboard: undefined;
  HifzReview: undefined;
  ReadingGoals: undefined;
  Collections: undefined;
  Tafsir: undefined;
};

/** Prayer: times, tracker, qibla, mosques, Ramadan. */
export type PrayerStackParamList = {
  PrayerHub: undefined;
  PrayerTimes: undefined;
  PrayerTracker: undefined;
  Qibla: undefined;
  Mosques: undefined;
  Ramadan: undefined;
};

/** Learn: duʿās, adhkār, hadith, the beautiful names. */
export type LearnStackParamList = {
  LearnHub: undefined;
  Duas: undefined;
  Adhkar: undefined;
  Hadith: undefined;
  Names: undefined;
};

/** More: settings and tools. */
export type MoreStackParamList = {
  MoreHub: undefined;
  Settings: undefined;
  Tasbih: undefined;
  HijriCalendar: undefined;
  Zakat: undefined;
  Downloads: undefined;
  Profile: undefined;
  Privacy: undefined;
};

/** The memorization screens now live in the Quran tab, as on web. */
export type HifzStackParamList = ReadStackParamList;

/** The bottom tabs. Route names stay stable ("Home", "Read"); labels are Today and Quran. */
export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Read: NavigatorScreenParams<ReadStackParamList> | undefined;
  Prayer: NavigatorScreenParams<PrayerStackParamList> | undefined;
  Learn: NavigatorScreenParams<LearnStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};

/** The app root: the tab bar, plus a catch-all for unrecognised URLs/deep links (#246). */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  NotFound: undefined;
};
