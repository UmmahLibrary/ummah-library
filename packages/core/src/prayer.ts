/**
 * Prayer-times domain: framework-free types, the calculation-method catalogue,
 * and pure helpers. The astronomical calculation itself lives behind the
 * {@link PrayerTimesCalculator} port (implemented in `adapters` with `adhan`);
 * everything here is deterministic and unit-tested.
 */

/** A geographic point. */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** The six daily timing markers, in chronological order. */
export const TIMING_NAMES = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof TIMING_NAMES)[number];

/** The five obligatory prayers (sunrise is a marker, not a prayer). */
export const OBLIGATORY_PRAYERS: readonly PrayerName[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

/** A day's computed times as ISO-8601 instants (UTC), one per timing. */
export type PrayerTimings = Record<PrayerName, string>;

/**
 * Computed night markers beyond the five prayers + sunrise: the pre-dawn
 * fasting cut-off (Imsāk), Islamic midnight, and the start of the last third of
 * the night (the preferred window for Tahajjud). These are *not* tracked or
 * reminded like the obligatory prayers, so they sit outside {@link PrayerName}.
 */
export const SUPPLEMENTARY_TIMING_NAMES = ["imsak", "midnight", "lastThird"] as const;
export type SupplementaryTimingName = (typeof SUPPLEMENTARY_TIMING_NAMES)[number];

export const SUPPLEMENTARY_TIMING_LABELS: Record<SupplementaryTimingName, string> = {
  imsak: "Imsāk",
  midnight: "Islamic midnight",
  lastThird: "Last third (Tahajjud)",
};

/** The supplementary night markers as ISO-8601 instants (UTC). */
export type SupplementaryTimings = Record<SupplementaryTimingName, string>;

/** The five prayers + sunrise, plus the supplementary night markers. */
export type ExtendedPrayerTimings = PrayerTimings & SupplementaryTimings;

/**
 * Imsāk precedes Fajr by this many minutes — the common fixed precautionary
 * offset used when a method carries no Imsāk angle of its own.
 */
export const IMSAK_OFFSET_MINUTES = 10;

/** Imsāk as the instant `offsetMinutes` before Fajr. Pure. */
export function imsakFromFajr(fajrIso: string, offsetMinutes = IMSAK_OFFSET_MINUTES): string {
  return new Date(new Date(fajrIso).getTime() - offsetMinutes * 60_000).toISOString();
}

/** The madhab affects the Asr time (Hanafi uses the later shadow length). */
export type Madhab = "shafi" | "hanafi";

export const MADHABS: readonly { id: Madhab; label: string }[] = [
  { id: "shafi", label: "Standard (Shāfiʿī / Mālikī / Ḥanbalī)" },
  { id: "hanafi", label: "Ḥanafī (later Asr)" },
];

/** One selectable calculation method. Ids match the adapter's `adhan` mapping. */
export interface CalculationMethodInfo {
  id: string;
  label: string;
}

/** The calculation methods offered to the user (a subset of `adhan`'s presets). */
export const CALCULATION_METHODS: readonly CalculationMethodInfo[] = [
  { id: "MuslimWorldLeague", label: "Muslim World League" },
  { id: "Egyptian", label: "Egyptian General Authority" },
  { id: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "UmmAlQura", label: "Umm al-Qura, Makkah" },
  { id: "Dubai", label: "Dubai" },
  { id: "Qatar", label: "Qatar" },
  { id: "Kuwait", label: "Kuwait" },
  { id: "Singapore", label: "Singapore" },
  { id: "Turkey", label: "Diyanet, Turkey" },
  { id: "Tehran", label: "Institute of Geophysics, Tehran" },
  { id: "NorthAmerica", label: "ISNA, North America" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee" },
];

export const DEFAULT_CALCULATION_METHOD = "MuslimWorldLeague";

/** Whether a method id is one we offer (used to validate API input). */
export function isCalculationMethod(id: string): boolean {
  return CALCULATION_METHODS.some((m) => m.id === id);
}

/**
 * How to resolve Fajr/Isha where, in high summer, the sun never reaches the
 * required depression angle and the pure calculation has no answer. `"none"`
 * keeps the raw method (correct for most latitudes); the others split the night
 * into portions. Ids map to `adhan`'s `HighLatitudeRule` in the adapter.
 */
export type HighLatitudeRuleId = "none" | "MiddleOfTheNight" | "SeventhOfTheNight" | "TwilightAngle";

export interface HighLatitudeRuleInfo {
  id: HighLatitudeRuleId;
  label: string;
}

export const HIGH_LATITUDE_RULES: readonly HighLatitudeRuleInfo[] = [
  { id: "none", label: "None (standard)" },
  { id: "MiddleOfTheNight", label: "Middle of the night" },
  { id: "SeventhOfTheNight", label: "One-seventh of the night" },
  { id: "TwilightAngle", label: "Angle-based" },
];

export const DEFAULT_HIGH_LATITUDE_RULE: HighLatitudeRuleId = "none";

/** Whether an id is one of the offered high-latitude rules (validates API input). */
export function isHighLatitudeRule(id: string): id is HighLatitudeRuleId {
  return HIGH_LATITUDE_RULES.some((r) => r.id === id);
}

/**
 * The next obligatory prayer at or after `now` from a single day's timings, or
 * `null` if every prayer for that day has already passed. Pure: the clock is an
 * argument, never read internally.
 */
export function nextPrayer(
  timings: PrayerTimings,
  now: Date,
): { name: PrayerName; at: Date } | null {
  const t = now.getTime();
  for (const name of OBLIGATORY_PRAYERS) {
    const at = new Date(timings[name]);
    if (at.getTime() > t) return { name, at };
  }
  return null;
}

/** A reminder for one prayer: which prayer, and the instant it begins. */
export interface PrayerReminder {
  prayer: PrayerName;
  /** ISO-8601 instant the prayer begins (its adhān time). */
  at: string;
}

/**
 * The prayer reminders still ahead of `now` for a single day: each obligatory
 * prayer the user has enabled whose time has not yet passed, in chronological
 * order. The delivery mechanism is a separate concern (the {@link Notifier}
 * port) — this only decides *what* and *when*. Pure: the clock is injected.
 */
export function prayerReminders(
  timings: PrayerTimings,
  enabled: Partial<Record<PrayerName, boolean>>,
  now: Date,
): PrayerReminder[] {
  const t = now.getTime();
  return OBLIGATORY_PRAYERS.filter((p) => enabled[p])
    .map((p) => ({ prayer: p, at: timings[p] }))
    .filter((r) => new Date(r.at).getTime() > t);
}
