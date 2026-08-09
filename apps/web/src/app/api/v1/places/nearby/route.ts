import { placesProvider } from "@ummahlibrary/api";
import { apiJson } from "../../../../../lib/api-response";

// Depends on the caller's coordinates, so it can't be prerendered (mirrors
// /api/v1/prayer-times — ADR 0012, ADR 0038).
export const dynamic = "force-dynamic";

const DEFAULT_RADIUS_METERS = 5000;
const MIN_RADIUS_METERS = 200;
const MAX_RADIUS_METERS = 20000;
// Overpass can return a large tag-heavy payload in a dense city; cap what we
// hand back after sorting so the response stays small and predictable.
const MAX_RESULTS = 50;

const ATTRIBUTION = "© OpenStreetMap contributors";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radiusParam = Number(url.searchParams.get("radius"));

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return apiJson({ error: "bad_coordinates" }, { status: 400 });
  }

  const radiusMeters = Number.isFinite(radiusParam)
    ? Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, radiusParam))
    : DEFAULT_RADIUS_METERS;

  const coordinates = { latitude: lat, longitude: lng };
  try {
    const places = await placesProvider.nearbyMosques(coordinates, radiusMeters);
    return apiJson({
      coordinates,
      radiusMeters,
      places: places.slice(0, MAX_RESULTS),
      attribution: ATTRIBUTION,
    });
  } catch {
    // A hard network failure talking to Overpass (offline, DNS, timeout) — a
    // distinct error the UI can show, separate from a genuine empty result.
    return apiJson({ error: "places_unavailable" }, { status: 502 });
  }
}
