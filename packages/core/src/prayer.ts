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
