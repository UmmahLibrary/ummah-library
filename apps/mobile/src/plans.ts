/**
 * Reading plans — structured journeys through the Book. Plan *definitions* are
 * static; a reader's progress is local-first state in AsyncStorage (`ul.readingPlan`,
 * mirroring the web reader, ADR 0006). Only one plan is active at a time.
 *
 * Each plan day points at something readable (a juzʾ or a sūrah) so "Read today"
 * can deep-link straight into the reader.
 */
import { KEYS, getJSON, setJSON } from "./storage";

export type DayTarget = { kind: "juz"; juz: number } | { kind: "surah"; surah: number };

export interface PlanDay {
  label: string;
  est: string;
  target: DayTarget;
}

export interface ReadingPlan {
  id: string;
  name: string;
  tag: string; // e.g. "30 days"
  len: string; // e.g. "Juzʾ a day"
  desc: string;
  days: PlanDay[];
}

const ramadanDays: PlanDay[] = Array.from({ length: 30 }, (_, i) => ({
  label: `Juzʾ ${i + 1}`,
  est: "~22 min",
  target: { kind: "juz", juz: i + 1 },
}));

export const PLANS: ReadingPlan[] = [
  {
    id: "ramadan-khatm",
    name: "Ramaḍān Khatm",
    tag: "30 days",
    len: "Juzʾ a day",
    desc: "Complete the Quran in a month, one juzʾ each day.",
    days: ramadanDays,
  },
  {
    id: "juz-amma",
    name: "The Last Juzʾ",
    tag: "7 days",
    len: "Juzʾ ʿAmma",
    desc: "Read and reflect on Juzʾ ʿAmma — the short sūrahs most of us recite in ṣalāh.",
    days: [
      { label: "An-Naba → ʿAbasa", est: "~12 min", target: { kind: "surah", surah: 78 } },
      { label: "At-Takwīr → Al-Inshiqāq", est: "~10 min", target: { kind: "surah", surah: 81 } },
      { label: "Al-Burūj → Al-Ghāshiyah", est: "~10 min", target: { kind: "surah", surah: 85 } },
      { label: "Al-Fajr → Al-Layl", est: "~11 min", target: { kind: "surah", surah: 89 } },
      { label: "Aḍ-Ḍuḥā → Al-ʿĀdiyāt", est: "~9 min", target: { kind: "surah", surah: 93 } },
      { label: "Al-Qāriʿah → Al-Masad", est: "~8 min", target: { kind: "surah", surah: 101 } },
      { label: "Al-Ikhlāṣ → An-Nās", est: "~4 min", target: { kind: "surah", surah: 112 } },
    ],
  },
  {
    id: "jewels",
    name: "Jewels of the Quran",
    tag: "5 days",
    len: "A sūrah a day",
    desc: "Five beloved sūrahs to read slowly with their meanings.",
    days: [
      { label: "Al-Fātiḥah", est: "~3 min", target: { kind: "surah", surah: 1 } },
      { label: "Yā-Sīn", est: "~15 min", target: { kind: "surah", surah: 36 } },
      { label: "Ar-Raḥmān", est: "~12 min", target: { kind: "surah", surah: 55 } },
      { label: "Al-Mulk", est: "~9 min", target: { kind: "surah", surah: 67 } },
      { label: "Al-Kahf", est: "~25 min", target: { kind: "surah", surah: 18 } },
    ],
  },
];

export interface PlanProgress {
  planId: string;
  startDate: string; // YYYY-MM-DD
  completed: number[]; // 0-based day indices done
}

export function planById(id: string): ReadingPlan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function readPlanProgress(): Promise<PlanProgress | null> {
  return getJSON<PlanProgress | null>(KEYS.readingPlan, null);
}

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function startPlan(planId: string): Promise<void> {
  const next: PlanProgress = { planId, startDate: todayStr(), completed: [] };
  await setJSON(KEYS.readingPlan, next);
}

export async function clearPlan(): Promise<void> {
  await setJSON(KEYS.readingPlan, null);
}

export async function toggleDay(dayIndex: number): Promise<void> {
  const p = await readPlanProgress();
  if (!p) return;
  const set = new Set(p.completed);
  if (set.has(dayIndex)) set.delete(dayIndex);
  else set.add(dayIndex);
  await setJSON(KEYS.readingPlan, { ...p, completed: [...set].sort((a, b) => a - b) });
}

/** The 1-based day the reader is on: the first uncompleted day, capped to the plan length. */
export function currentDay(plan: ReadingPlan, progress: PlanProgress): number {
  for (let i = 0; i < plan.days.length; i++) {
    if (!progress.completed.includes(i)) return i + 1;
  }
  return plan.days.length;
}

export function planPercent(plan: ReadingPlan, progress: PlanProgress): number {
  return Math.round((progress.completed.length / plan.days.length) * 100);
}
