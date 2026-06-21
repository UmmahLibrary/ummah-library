/**
 * Web persistence for the hifz review streak (ADR 0024), under `ul.hifz.streak`.
 * Sync; the `*-store` file is the sanctioned `localStorage` home. The streak
 * *logic* (advancing it once per day) stays in `./hifz-streak`.
 */
import type { StreakData } from "./hifz-streak";

const KEY = "ul.hifz.streak";

export function readStreak(): StreakData {
  try {
    return (
      (JSON.parse(localStorage.getItem(KEY) ?? "null") as StreakData | null) ?? {
        count: 0,
        lastDate: "",
      }
    );
  } catch {
    return { count: 0, lastDate: "" };
  }
}

export function writeStreak(data: StreakData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}
