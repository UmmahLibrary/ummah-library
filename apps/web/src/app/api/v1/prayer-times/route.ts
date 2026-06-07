import { prayerTimes } from "@ummahlibrary/api";
import { isCalculationMethod } from "@ummahlibrary/core";
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

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return apiJson({ error: "bad_coordinates" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiJson({ error: "bad_date" }, { status: 400 });
  }
  const resolvedMethod = isCalculationMethod(method) ? method : "MuslimWorldLeague";

  const coordinates = { latitude: lat, longitude: lng };
  const timings = await prayerTimes.calculate({ coordinates, date, method: resolvedMethod, madhab });
  return apiJson({ coordinates, date, method: resolvedMethod, madhab, timings });
}
