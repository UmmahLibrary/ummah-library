"use client";

import { readStreak, writeStreak } from "./hifz-streak-store";

export interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
