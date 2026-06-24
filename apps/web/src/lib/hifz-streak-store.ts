/**
 * Web persistence for the hifz review streak (ADR 0024), under `ul.hifz.streak`.
 * Sync; the `*-store` file is the sanctioned `localStorage` home. The streak
 * *logic* (advancing it once per day) stays in `./hifz-streak`.
 */
import type { StreakData } from "./hifz-streak";

const KEY = "ul.hifz.streak";

export function readStreak(): StreakData {
  const empty: StreakData = { count: 0, lastDate: "" };
  try {
    // A corrupt/peer-synced non-object (or one missing count/lastDate) would make
    // advanceStreak produce a NaN count — require the real shape, else start fresh.
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as unknown;
    return v !== null &&
      typeof v === "object" &&
      typeof (v as StreakData).count === "number" &&
      typeof (v as StreakData).lastDate === "string"
      ? (v as StreakData)
      : empty;
  } catch {
    return empty;
  }
}

export function writeStreak(data: StreakData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}
