import {
  CalculationMethod,
  type CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
  SunnahTimes,
} from "adhan";
import type {
  ExtendedPrayerTimings,
  HighLatitudeRuleId,
  PrayerTimesCalculator,
  PrayerTimesQuery,
} from "@ummahlibrary/core";
import { DEFAULT_CALCULATION_METHOD, imsakFromFajr } from "@ummahlibrary/core";

/** Method id → the `adhan` preset factory. Keys match `core.CALCULATION_METHODS`. */
const METHOD_FACTORIES: Record<string, () => CalculationParameters> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Dubai: CalculationMethod.Dubai,
  Qatar: CalculationMethod.Qatar,
  Kuwait: CalculationMethod.Kuwait,
  Singapore: CalculationMethod.Singapore,
  Turkey: CalculationMethod.Turkey,
  Tehran: CalculationMethod.Tehran,
  NorthAmerica: CalculationMethod.NorthAmerica,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
};

/** Rule id → `adhan`'s `HighLatitudeRule`. `"none"` (and unknown) leaves the default. */
const HIGH_LATITUDE_RULES: Partial<
  Record<HighLatitudeRuleId, CalculationParameters["highLatitudeRule"]>
> = {
  MiddleOfTheNight: HighLatitudeRule.MiddleOfTheNight,
  SeventhOfTheNight: HighLatitudeRule.SeventhOfTheNight,
  TwilightAngle: HighLatitudeRule.TwilightAngle,
};

/**
 * `PrayerTimesCalculator` backed by the `adhan` library (ADR 0012). The
 * calculation is pure and local — no network — but lives in an adapter so the
 * astronomy stays a swappable detail behind the core port. Alongside the five
 * prayers + sunrise it derives the supplementary night markers: Imsāk (a fixed
 * offset before Fajr, in `core`) and Islamic midnight / last third of the night
 * (`adhan`'s `SunnahTimes`, which spans into the next day's Fajr).
 */
export class AdhanPrayerTimes implements PrayerTimesCalculator {
  calculate(query: PrayerTimesQuery): Promise<ExtendedPrayerTimings> {
    const { coordinates, date, method, madhab, highLatitudeRule } = query;
    const params = (METHOD_FACTORIES[method] ?? METHOD_FACTORIES[DEFAULT_CALCULATION_METHOD]!)();
    params.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
    const rule = highLatitudeRule && HIGH_LATITUDE_RULES[highLatitudeRule];
    if (rule) params.highLatitudeRule = rule;

    const coords = new Coordinates(coordinates.latitude, coordinates.longitude);
    // Anchor on noon UTC of the requested calendar date so the day used for the
    // sun position is stable regardless of the server's timezone.
    const when = new Date(`${date}T12:00:00Z`);
    const t = new PrayerTimes(coords, when, params);
    const sunnah = new SunnahTimes(t);

    // `.toISOString()` throws on an invalid Date, and near the poles adhan can
    // return an invalid Date for the five prayers + sunrise too — not only the
    // Sunnah markers. Route EVERY instant through this guard so a polar day
    // degrades to empty strings the UI skips, never an unhandled rejection.
    const iso = (d: Date) => (Number.isNaN(d.getTime()) ? "" : d.toISOString());
    const fajr = iso(t.fajr);

    return Promise.resolve({
      fajr,
      sunrise: iso(t.sunrise),
      dhuhr: iso(t.dhuhr),
      asr: iso(t.asr),
      maghrib: iso(t.maghrib),
      isha: iso(t.isha),
      // Don't synthesise Imsāk from an empty Fajr (`new Date("")` → 1970 / throw).
      imsak: fajr ? imsakFromFajr(fajr) : "",
      midnight: iso(sunnah.middleOfTheNight),
      lastThird: iso(sunnah.lastThirdOfTheNight),
    });
  }
}
