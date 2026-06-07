import {
  CalculationMethod,
  type CalculationParameters,
  Coordinates,
  Madhab,
  PrayerTimes,
} from "adhan";
import type { PrayerTimesCalculator, PrayerTimesQuery, PrayerTimings } from "@ummahlibrary/core";
import { DEFAULT_CALCULATION_METHOD } from "@ummahlibrary/core";

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

/**
 * `PrayerTimesCalculator` backed by the `adhan` library (ADR 0012). The
 * calculation is pure and local — no network — but lives in an adapter so the
 * astronomy stays a swappable detail behind the core port.
 */
export class AdhanPrayerTimes implements PrayerTimesCalculator {
  calculate(query: PrayerTimesQuery): Promise<PrayerTimings> {
    const { coordinates, date, method, madhab } = query;
    const params = (METHOD_FACTORIES[method] ?? METHOD_FACTORIES[DEFAULT_CALCULATION_METHOD]!)();
    params.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;

    const coords = new Coordinates(coordinates.latitude, coordinates.longitude);
    // Anchor on noon UTC of the requested calendar date so the day used for the
    // sun position is stable regardless of the server's timezone.
    const when = new Date(`${date}T12:00:00Z`);
    const t = new PrayerTimes(coords, when, params);

    return Promise.resolve({
      fajr: t.fajr.toISOString(),
      sunrise: t.sunrise.toISOString(),
      dhuhr: t.dhuhr.toISOString(),
      asr: t.asr.toISOString(),
      maghrib: t.maghrib.toISOString(),
      isha: t.isha.toISOString(),
    });
  }
}
