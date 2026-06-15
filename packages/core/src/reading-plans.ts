/**
 * Reading plans — structured journeys through the Book. Plan *definitions* are
 * static and pure (no I/O); a reader's progress is local-first state persisted
 * by each app (`ul.readingPlan`, ADR 0006). Only one plan is active at a time.
 *
 * Each plan day points at something readable (a juzʾ or a sūrah) so "Read today"
 * can deep-link straight into the reader on either platform.
 */

export type DayTarget = { kind: "juz"; juz: number } | { kind: "surah"; surah: number };

export interface PlanDay {
  label: string;
  est: string;
  target: DayTarget;
}

export interface ReadingPlan {
  id: string;
  name: string;
  /** Short badge, e.g. "30 days". */
  tag: string;
  /** Cadence, e.g. "Juzʾ a day". */
  len: string;
  desc: string;
  days: PlanDay[];
}

export interface PlanProgress {
  planId: string;
  /** YYYY-MM-DD the plan was started. */
  startDate: string;
  /** 0-based day indices completed. */
  completed: number[];
}

const ramadanDays: PlanDay[] = Array.from({ length: 30 }, (_, i) => ({
  label: `Juzʾ ${i + 1}`,
  est: "~22 min",
  target: { kind: "juz", juz: i + 1 },
}));

/** The built-in plan library, shared by web and mobile. */
export const PLANS: readonly ReadingPlan[] = [
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

export function planById(id: string): ReadingPlan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** The 1-based day the reader is on: the first uncompleted day, capped to the plan length. */
export function currentPlanDay(plan: ReadingPlan, progress: PlanProgress): number {
  for (let i = 0; i < plan.days.length; i++) {
    if (!progress.completed.includes(i)) return i + 1;
  }
  return plan.days.length;
}

export function planPercent(plan: ReadingPlan, progress: PlanProgress): number {
  if (plan.days.length === 0) return 0;
  return Math.round((progress.completed.length / plan.days.length) * 100);
}

/** Toggle a 0-based day's completion, returning the next progress (pure). */
export function togglePlanDay(progress: PlanProgress, dayIndex: number): PlanProgress {
  const set = new Set(progress.completed);
  if (set.has(dayIndex)) set.delete(dayIndex);
  else set.add(dayIndex);
  return { ...progress, completed: [...set].sort((a, b) => a - b) };
}

/** A window of up to seven plan days centred on the current day (1-based day numbers). */
export function planWeekWindow(plan: ReadingPlan, day: number): number[] {
  const len = plan.days.length;
  const size = Math.min(7, len);
  let start = day - 3;
  if (start < 1) start = 1;
  if (start + size - 1 > len) start = len - size + 1;
  return Array.from({ length: size }, (_, i) => start + i);
}
