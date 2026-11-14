/**
 * Kids mode progress (ADR 0041): which short surahs a child has finished.
 * Local to this device only — no account, no analytics, nothing leaves it.
 * Deliberately no dates, streaks or counts beyond "finished".
 */
const KEY = "ul.kids.finished";
export const KIDS_EVENT = "ul.kids";

/** Surahs shown in Kids mode: Al-Fātiḥah, then Juz ʿAmma from the shortest end. */
export const KIDS_SURAHS: readonly number[] = [
  1, 112, 113, 114, 108, 103, 110, 111, 109, 107, 106, 105, 102, 101, 104, 100, 99, 97, 95, 94, 93,
];

export function readKidsFinished(): Set<number> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(raw) ? raw.filter((n): n is number => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

export function markKidsFinished(surah: number): Set<number> {
  const next = readKidsFinished();
  next.add(surah);
  try {
    localStorage.setItem(KEY, JSON.stringify([...next]));
    window.dispatchEvent(new CustomEvent(KIDS_EVENT));
  } catch {
    /* storage blocked */
  }
  return next;
}
