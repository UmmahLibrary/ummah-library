"use client";

const KEY = "ul.hifz.streak";

export interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getStreak(): StreakData {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? "null") as StreakData | null) ?? {
      count: 0,
      lastDate: "",
    };
  } catch {
    return { count: 0, lastDate: "" };
  }
}

/** Call once per session when the user completes at least one review. */
export function touchStreak(): StreakData {
  const today = toDateStr(new Date());
  const current = getStreak();
  if (current.lastDate === today) return current;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const next: StreakData = {
    count: current.lastDate === toDateStr(yesterday) ? current.count + 1 : 1,
    lastDate: today,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}
