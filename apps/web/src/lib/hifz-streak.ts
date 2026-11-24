"use client";

import { readStreak, writeStreak } from "./hifz-streak-store";

export interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

/** The local calendar day — the same day key mobile and the review heatmap use. */
function toDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function getStreak(): StreakData {
  return readStreak();
}

/** Call once per session when the user completes at least one review. */
export function touchStreak(): StreakData {
  const today = toDateStr(new Date());
  const current = readStreak();
  if (current.lastDate === today) return current;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const next: StreakData = {
    count: current.lastDate === toDateStr(yesterday) ? current.count + 1 : 1,
    lastDate: today,
  };
  writeStreak(next);
  return next;
}
