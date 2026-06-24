import { prayerTimes } from "@ummahlibrary/api";
import {
  DEFAULT_HIGH_LATITUDE_RULE,
  isCalculationMethod,
  isHighLatitudeRule,
  isValidDateString,
} from "@ummahlibrary/core";
import { apiJson } from "../../../../lib/api-response";

// Depends on the caller's coordinates and date, so it can't be prerendered.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const date = url.searchParams.get("date") ?? "";
  const method = url.searchParams.get("method") ?? "MuslimWorldLeague";
  const madhab = url.searchParams.get("madhab") === "hanafi" ? "hanafi" : "shafi";
  const hlrParam = url.searchParams.get("hlr") ?? "";
  const highLatitudeRule = isHighLatitudeRule(hlrParam) ? hlrParam : DEFAULT_HIGH_LATITUDE_RULE;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return apiJson({ error: "bad_coordinates" }, { status: 400 });
  }
  // Strict calendar validation (rejects 2026-02-30 etc.), not just the digit shape,
  // so the echoed `date` always matches the day actually computed.
  if (!isValidDateString(date)) {
    return apiJson({ error: "bad_date" }, { status: 400 });
  }
  const resolvedMethod = isCalculationMethod(method) ? method : "MuslimWorldLeague";

  const coordinates = { latitude: lat, longitude: lng };
  const timings = await prayerTimes.calculate({
    coordinates,
    date,
    method: resolvedMethod,
    madhab,
    highLatitudeRule,
  });
  return apiJson({ coordinates, date, method: resolvedMethod, madhab, highLatitudeRule, timings });
}
