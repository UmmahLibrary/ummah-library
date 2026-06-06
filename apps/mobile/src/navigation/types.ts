import type { NavigatorScreenParams } from "@react-navigation/native";

/** The Read tab's stack: surah list → a surah, or a juzʾ. */
export type ReadStackParamList = {
  SurahList: undefined;
  SurahReader: { surah: number };
  JuzReader: { juz: number };
};

/** The bottom tabs. */
export type RootTabParamList = {
  Read: NavigatorScreenParams<ReadStackParamList> | undefined;
  Hifz: undefined;
  Hadith: undefined;
  Settings: undefined;
};
