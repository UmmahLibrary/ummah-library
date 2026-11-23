/**
 * Reader-side glue for "Go to" (ADR 0041). Parsing lives in core
 * (`parseGoTo`); this decides what the open reader does with a target — scroll
 * in place (offering "Back to" where you were) or open another surah — and
 * small display helpers for the Home week strip. Pure.
 */
import type { GoToSurahName, GoToTarget } from "@ummahlibrary/core";

export type GoToPlan =
  | { type: "scroll"; aya: number; backTo: number | null }
  | { type: "navigate"; sura: number; aya: number };

/**
 * A target in the open surah scrolls to its āyah and remembers where the reader
 * was (unless it's the same āyah); any other surah navigates.
 */
export function planGoTo(target: GoToTarget, currentSurah: number, currentAya: number): GoToPlan {
  if (target.sura !== currentSurah) return { type: "navigate", sura: target.sura, aya: target.aya };
  const from = currentAya > 0 && currentAya !== target.aya ? currentAya : null;
  return { type: "scroll", aya: target.aya, backTo: from };
}

/** The core Go-to name list from API surah metadata. */
export function goToNames(
  surahs: readonly {
    number: number;
    name: string;
    transliteration: string;
    englishName: string;
  }[],
): GoToSurahName[] {
  return surahs.map((s) => ({
    number: s.number,
    name: s.name,
    transliteration: s.transliteration,
    englishName: s.englishName,
  }));
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Short weekday label for a `YYYY-MM-DD` date (calendar date, timezone-free). */
export function weekdayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return WEEKDAY[d.getUTCDay()] ?? "";
}
