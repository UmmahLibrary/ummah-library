/**
 * Reading plans — structured journeys through the Book.
 *
 * The domain is pure and deterministic (ADR 0001/0003): no I/O, no framework,
 * no `Date.now()`. Anything time-dependent takes an injected `today`
 * (`YYYY-MM-DD`) so the maths is fully testable. A reader's progress is
 * local-first state persisted by each app (`ul.readingPlan`, ADR 0006); only
 * one plan is active at a time.
 *
 * A plan covers an ordered list of *units* (juzʾ / ḥizb / page / sūrah / ayah)
 * drawn from the invariant Quran structure in `./quran-structure`. Two
 * scheduling strategies decide the pace:
 *
 * - `fixed`      — a set cadence (e.g. one juzʾ a day); the end date is derived.
 * - `targetDate` — a chosen finish date; the daily amount is derived so the plan
 *                  completes on or before that date.
 *
 * Days are spread with an even cumulative distribution
 * (`cum(d) = ⌊d·total / days⌋`) so `cum(0) = 0`, `cum(days) = total`, and every
 * day differs by at most one unit.
 */
import type { VerseKey } from "./entities";
import {
  AYAH_COUNTS,
  HIZB_STARTS,
  JUZ_STARTS,
  PAGE_STARTS,
  TOTAL_HIZB,
  TOTAL_JUZ,
  ayahCountOf,
  ordinalToRef,
  pageRange,
} from "./quran-structure";
// UTC `YYYY-MM-DD` date maths is shared with the reading-goals domain, where
// `addDays`/`daysBetween` already live (prayer-tracker reuses them the same way).
import { addDays, daysBetween } from "./reading-goals";

// ── Types ──────────────────────────────────────────────────────────────────

/** The atomic readable unit a plan counts in. */
export type PlanUnit = "juz" | "hizb" | "page" | "surah" | "ayah";

/** Where "Read today" should deep-link for the start of a day's portion. */
export type DayTarget =
  | { kind: "juz"; juz: number }
  | { kind: "hizb"; hizb: number }
  | { kind: "page"; page: number }
  | { kind: "surah"; surah: number }
  | { kind: "ayah"; ref: VerseKey };

/** The slice of the Book a plan covers: an ordered list of 1-based unit indices. */
export interface PlanRange {
  unit: PlanUnit;
  /** e.g. `[1..30]` for the whole Quran by juzʾ, or `[1, 36, 55, 67, 18]`. */
  units: number[];
}

/** How a plan paces itself across the days. */
export type ScheduleStrategy =
  | { kind: "fixed"; unitsPerDay: number }
  | { kind: "targetDate"; endDate: string };

/** A reusable catalogue entry — no start date, no progress. */
export interface PlanTemplate {
  id: string;
  name: string;
  /** Short badge, e.g. "30 days". */
  tag: string;
  /** Cadence label, e.g. "Juzʾ a day". */
  len: string;
  desc: string;
  range: PlanRange;
  schedule: ScheduleStrategy;
}

/** A template a reader has started: a self-contained snapshot + progress. */
export interface ActivePlan {
  /** Denormalised so an in-flight plan survives catalogue changes (offline). */
  template: PlanTemplate;
  /** `YYYY-MM-DD` the plan was started. */
  startDate: string;
  /** Atomic units completed so far (a linear cursor, 0…total). */
  unitsRead: number;
}

/** What to read on a given day, resolved to deep-linkable Quran references. */
export interface DayPortion {
  /** 1-based day number. */
  day: number;
  unit: PlanUnit;
  /** Number of units scheduled this day (0 if the plan has already ended). */
  count: number;
  /** First / last unit index of the day (1-based; 0 when `empty`). */
  fromUnit: number;
  toUnit: number;
  startRef: VerseKey;
  endRef: VerseKey;
  target: DayTarget;
  /** e.g. "Juzʾ 5", "Sūrahs 78–80", "Pages 21–22". */
  label: string;
  /** Rough reading estimate, e.g. "~22 min". */
  est: string;
  /** True when there is nothing left to read on this day. */
  empty: boolean;
}

/** A not-yet-started plan, for validating the custom-plan creator. */
export interface PlanDraft {
  range: PlanRange;
  schedule: ScheduleStrategy;
  startDate: string;
}

/** A change applied by {@link reschedule}. */
export type RescheduleChange =
  | { kind: "fixed"; unitsPerDay: number }
  | { kind: "targetDate"; endDate: string };

// ── Local helpers ───────────────────────────────────────────────────────────

const LAST_VERSE: VerseKey = { sura: 114, aya: 6 };

/** Whether a string is a real `YYYY-MM-DD` calendar date. */
export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
}

// ── Unit ↔ Quran-structure conversions (reuse ./quran-structure) ────────────

/** The verse immediately before `ref` in mushaf order. */
function verseBefore(ref: VerseKey): VerseKey {
  return ref.aya > 1
    ? { sura: ref.sura, aya: ref.aya - 1 }
    : { sura: ref.sura - 1, aya: ayahCountOf(ref.sura - 1) };
}

/** The first verse of unit index `i` for `unit`. */
function unitStartRef(unit: PlanUnit, i: number): VerseKey {
  switch (unit) {
    case "surah":
      return { sura: i, aya: 1 };
    case "juz":
      return JUZ_STARTS[i - 1]!;
    case "hizb":
      return HIZB_STARTS[i - 1]!;
    case "page":
      return PAGE_STARTS[i - 1]!;
    case "ayah":
      return ordinalToRef(i);
  }
}

/** The last verse of unit index `i` for `unit`. */
function unitEndRef(unit: PlanUnit, i: number): VerseKey {
  switch (unit) {
    case "surah":
      return { sura: i, aya: ayahCountOf(i) };
    case "juz":
      return i >= TOTAL_JUZ ? LAST_VERSE : verseBefore(JUZ_STARTS[i]!);
    case "hizb":
      return i >= TOTAL_HIZB ? LAST_VERSE : verseBefore(HIZB_STARTS[i]!);
    case "page":
      return pageRange(i).end;
    case "ayah":
      return ordinalToRef(i);
  }
}

/** A deep-link target for the start of unit index `i`. */
function unitTarget(unit: PlanUnit, i: number): DayTarget {
  switch (unit) {
    case "juz":
      return { kind: "juz", juz: i };
    case "hizb":
      return { kind: "hizb", hizb: i };
    case "page":
      return { kind: "page", page: i };
    case "surah":
      return { kind: "surah", surah: i };
    case "ayah":
      return { kind: "ayah", ref: ordinalToRef(i) };
  }
}

const UNIT_SINGULAR: Record<PlanUnit, string> = {
  juz: "Juzʾ",
  hizb: "Ḥizb",
  page: "Page",
  surah: "Sūrah",
  ayah: "Ayah",
};

const UNIT_PLURAL: Record<PlanUnit, string> = {
  juz: "Juzʾ",
  hizb: "Aḥzāb",
  page: "Pages",
  surah: "Sūrahs",
  ayah: "Ayahs",
};

function unitLabel(unit: PlanUnit, i: number): string {
  if (unit === "ayah") {
    const r = ordinalToRef(i);
    return `Ayah ${r.sura}:${r.aya}`;
  }
  return `${UNIT_SINGULAR[unit]} ${i}`;
}

/** A human label for a day's slice of units (handles single/contiguous/listed). */
function portionLabel(unit: PlanUnit, slice: number[]): string {
  if (slice.length === 1) return unitLabel(unit, slice[0]!);
  const from = slice[0]!;
  const to = slice[slice.length - 1]!;
  const contiguous = slice.every((u, idx) => u === from + idx);
  if (contiguous) return `${UNIT_PLURAL[unit]} ${from}–${to}`;
  return slice.map((u) => unitLabel(unit, u)).join(", ");
}

/** The 1-based ordinal (1…6236) of a verse in mushaf order. */
function refToOrdinal(ref: VerseKey): number {
  let n = ref.aya;
  for (let s = 1; s < ref.sura; s++) n += AYAH_COUNTS[s - 1]!;
  return n;
}

/** A rough reading estimate in minutes for a verse span (~6.3s per ayah). */
function estimateMinutes(start: VerseKey, end: VerseKey): number {
  const ayahs = refToOrdinal(end) - refToOrdinal(start) + 1;
  return Math.max(1, Math.round((ayahs * 6.3) / 60));
}

// ── Range builders + the launch catalogue ───────────────────────────────────

function seq(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

/** A contiguous juzʾ range, e.g. `rangeOfJuz(1, 30)` for the whole Quran. */
export function rangeOfJuz(from: number, to: number): PlanRange {
  return { unit: "juz", units: seq(from, to) };
}

/** A contiguous sūrah range, e.g. `rangeOfSurahs(78, 114)` for Juzʾ ʿAmma. */
export function rangeOfSurahs(from: number, to: number): PlanRange {
  return { unit: "surah", units: seq(from, to) };
}

/** A contiguous page range. */
export function rangeOfPages(from: number, to: number): PlanRange {
  return { unit: "page", units: seq(from, to) };
}

/** An explicit, possibly non-contiguous list of sūrahs. */
export function surahList(units: number[]): PlanRange {
  return { unit: "surah", units: [...units] };
}

/** The built-in catalogue, shared by web and mobile. */
export const PLAN_TEMPLATES: readonly PlanTemplate[] = [
  {
    id: "ramadan-khatm",
    name: "Ramaḍān Khatm",
    tag: "30 days",
    len: "Juzʾ a day",
    desc: "Complete the Quran in a month, one juzʾ each day.",
    range: rangeOfJuz(1, 30),
    schedule: { kind: "fixed", unitsPerDay: 1 },
  },
  {
    id: "juz-amma",
    name: "A Sūrah a Day",
    tag: "37 days",
    len: "Juzʾ ʿAmma",
    desc: "Read a sūrah of Juzʾ ʿAmma each day — the short sūrahs most of us recite in ṣalāh.",
    range: rangeOfSurahs(78, 114),
    schedule: { kind: "fixed", unitsPerDay: 1 },
  },
  {
    id: "jewels",
    name: "Jewels of the Quran",
    tag: "5 days",
    len: "A sūrah a day",
    desc: "Five beloved sūrahs to read slowly with their meanings.",
    range: surahList([1, 36, 55, 67, 18]),
    schedule: { kind: "fixed", unitsPerDay: 1 },
  },
];

export function templateById(id: string): PlanTemplate | undefined {
  return PLAN_TEMPLATES.find((t) => t.id === id);
}

// ── Schedule maths ──────────────────────────────────────────────────────────

/** Total atomic units in a range. */
export function totalUnits(range: PlanRange): number {
  return range.units.length;
}

function planTotal(plan: ActivePlan): number {
  return plan.template.range.units.length;
}

/**
 * The number of days the plan runs over. For `fixed`, derived from the cadence;
 * for `targetDate`, the inclusive span to the end date. Throws a `RangeError`
 * for an impossible plan (no units, a non-positive cadence, or an end date
 * before the start).
 */
export function planDuration(plan: ActivePlan): number {
  const total = planTotal(plan);
  if (total <= 0) throw new RangeError("A plan must cover at least one unit.");
  const s = plan.template.schedule;
  if (s.kind === "fixed") {
    if (!Number.isInteger(s.unitsPerDay) || s.unitsPerDay < 1) {
      throw new RangeError("A fixed plan must read at least one unit per day.");
    }
    return Math.ceil(total / s.unitsPerDay);
  }
  const span = daysBetween(plan.startDate, s.endDate);
  if (span < 0) throw new RangeError("The end date is before the start date.");
  return span + 1;
}

/** The date the plan is scheduled to finish (`YYYY-MM-DD`). */
export function planEndDate(plan: ActivePlan): string {
  const s = plan.template.schedule;
  return s.kind === "targetDate" ? s.endDate : addDays(plan.startDate, planDuration(plan) - 1);
}

/** Units that should be read by the end of day `day` (even distribution). */
export function cumulativeUnits(plan: ActivePlan, day: number): number {
  const total = planTotal(plan);
  const dur = planDuration(plan);
  if (day <= 0) return 0;
  if (day >= dur) return total;
  return Math.floor((day * total) / dur);
}

/** The calendar day the reader is on (1-based), clamped to the plan length. */
export function currentDay(plan: ActivePlan, today: string): number {
  const dur = planDuration(plan);
  const d = daysBetween(plan.startDate, today) + 1;
  return Math.min(Math.max(d, 1), dur);
}

/** Units still to read (never negative). */
export function unitsRemaining(plan: ActivePlan): number {
  return Math.max(0, planTotal(plan) - plan.unitsRead);
}

/** Completion as a 0–100 integer percentage. */
export function percentComplete(plan: ActivePlan): number {
  const total = planTotal(plan);
  if (total === 0) return 0;
  return Math.round((Math.min(plan.unitsRead, total) / total) * 100);
}

/** Whether everything scheduled through day `day` has been read. */
export function isDayComplete(plan: ActivePlan, day: number): boolean {
  return plan.unitsRead >= cumulativeUnits(plan, day);
}

/**
 * How far ahead (+) or behind (−) schedule the reader is, in whole days. `0`
 * means on track: you have finished every day before today and are working on
 * today (or beyond is counted as ahead).
 */
export function daysAheadBehind(plan: ActivePlan, today: string): number {
  const dur = planDuration(plan);
  const cal = currentDay(plan, today);
  let completed = 0;
  for (let d = 1; d <= dur; d++) {
    if (cumulativeUnits(plan, d) <= plan.unitsRead) completed = d;
    else break;
  }
  if (completed >= cal) return completed - cal; // ahead
  if (completed < cal - 1) return completed - (cal - 1); // behind
  return 0;
}

/**
 * The date the reader will actually finish at their current pace
 * (`YYYY-MM-DD`). Falls back to the planned end date before any progress, and
 * returns `today` once the plan is complete.
 */
export function projectedFinish(plan: ActivePlan, today: string): string {
  const total = planTotal(plan);
  if (plan.unitsRead >= total) return today;
  const daysSoFar = daysBetween(plan.startDate, today) + 1;
  if (daysSoFar < 1 || plan.unitsRead <= 0) return planEndDate(plan);
  const pace = plan.unitsRead / daysSoFar;
  const need = Math.ceil((total - plan.unitsRead) / pace);
  return addDays(today, need);
}

/** What to read on day `day`, resolved to references and a label. */
export function materializeDay(plan: ActivePlan, day: number): DayPortion {
  const { unit, units } = plan.template.range;
  const from = cumulativeUnits(plan, day - 1);
  const to = cumulativeUnits(plan, day);
  if (to <= from) {
    return {
      day,
      unit,
      count: 0,
      fromUnit: 0,
      toUnit: 0,
      startRef: { sura: 1, aya: 1 },
      endRef: { sura: 1, aya: 1 },
      target: { kind: "surah", surah: 1 },
      label: "Nothing scheduled",
      est: "—",
      empty: true,
    };
  }
  const slice = units.slice(from, to);
  const fromUnit = slice[0]!;
  const toUnit = slice[slice.length - 1]!;
  const startRef = unitStartRef(unit, fromUnit);
  const endRef = unitEndRef(unit, toUnit);
  return {
    day,
    unit,
    count: slice.length,
    fromUnit,
    toUnit,
    startRef,
    endRef,
    target: unitTarget(unit, fromUnit),
    label: portionLabel(unit, slice),
    est: `~${estimateMinutes(startRef, endRef)} min`,
    empty: false,
  };
}

/** Today's portion — what to read now to stay on schedule. */
export function computeTodayPortion(plan: ActivePlan, today: string): DayPortion {
  return materializeDay(plan, currentDay(plan, today));
}

/** A window of up to seven day numbers centred on `day` (for a week strip). */
export function planWeekWindow(plan: ActivePlan, day: number): number[] {
  const len = planDuration(plan);
  const size = Math.min(7, len);
  let start = day - 3;
  if (start < 1) start = 1;
  if (start + size - 1 > len) start = len - size + 1;
  return Array.from({ length: size }, (_, i) => start + i);
}

// ── Lifecycle (all pure; return the next state) ─────────────────────────────

/** Begin a template on `startDate` with no progress yet. */
export function activatePlan(template: PlanTemplate, startDate: string): ActivePlan {
  return { template, startDate, unitsRead: 0 };
}

/** Set the linear cursor, clamped to `[0, total]`. */
export function setUnitsRead(plan: ActivePlan, units: number): ActivePlan {
  const total = planTotal(plan);
  return { ...plan, unitsRead: Math.min(Math.max(0, Math.floor(units)), total) };
}

/**
 * Toggle a day's completion: if it is already done, retreat the cursor to the
 * end of the previous day; otherwise advance to the end of `day` (completing
 * every earlier day too, since reading is linear).
 */
export function toggleDayComplete(plan: ActivePlan, day: number): ActivePlan {
  const target = cumulativeUnits(plan, day);
  const prev = cumulativeUnits(plan, day - 1);
  return setUnitsRead(plan, plan.unitsRead >= target ? prev : target);
}

/**
 * Re-pace a plan, keeping its progress and start date. Used by catch-up flows:
 * "rebalance" passes the same end date (recomputing the daily amount), "extend"
 * passes a later one. Throws for an impossible change.
 */
export function reschedule(plan: ActivePlan, change: RescheduleChange): ActivePlan {
  if (change.kind === "targetDate" && daysBetween(plan.startDate, change.endDate) < 0) {
    throw new RangeError("The end date is before the start date.");
  }
  if (change.kind === "fixed" && (!Number.isInteger(change.unitsPerDay) || change.unitsPerDay < 1)) {
    throw new RangeError("A fixed plan must read at least one unit per day.");
  }
  return { ...plan, template: { ...plan.template, schedule: change } };
}

// ── Validation (for the custom-plan creator) ────────────────────────────────

/** Human-readable problems with a draft plan ( `[]` when it is valid). */
export function validatePlanDraft(draft: PlanDraft): string[] {
  const errors: string[] = [];
  if (draft.range.units.length === 0) errors.push("Choose at least one portion to read.");
  if (draft.schedule.kind === "fixed") {
    if (!Number.isInteger(draft.schedule.unitsPerDay) || draft.schedule.unitsPerDay < 1) {
      errors.push("Read at least one unit per day.");
    }
  } else if (!isValidDateString(draft.schedule.endDate)) {
    errors.push("Pick a valid end date.");
  } else if (daysBetween(draft.startDate, draft.schedule.endDate) < 0) {
    errors.push("The end date can’t be before the start date.");
  }
  return errors;
}
