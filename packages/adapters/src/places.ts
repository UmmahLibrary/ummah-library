/**
 * `PlacesProvider` backed by OpenStreetMap's Overpass API (ADR 0038): mosques
 * (`amenity=place_of_worship` + `religion=muslim`) within a radius of a point.
 * Read-only, keyless, ODbL-licensed public data — no accounts, nothing stored.
 * Called server-side from the `/api/v1/places/nearby` route (never straight
 * from an app — AGENTS rule 2), so a descriptive `User-Agent` can be set per
 * Overpass's usage policy for automated clients.
 */
import type { Coordinates, Place, PlacesProvider } from "@ummahlibrary/core";
import { sortByDistance } from "@ummahlibrary/core";

/** The standard public Overpass instance (overpass-api.de) — no API key. */
export const DEFAULT_OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

type FetchLike = typeof fetch;

/** Overpass QL: every node/way/relation tagged as a mosque within the radius. */
function buildQuery(coords: Coordinates, radiusMeters: number): string {
  const around = `(around:${radiusMeters},${coords.latitude},${coords.longitude})`;
  const filter = `["amenity"="place_of_worship"]["religion"="muslim"]${around}`;
  return `[out:json][timeout:25];(node${filter};way${filter};relation${filter};);out center tags;`;
}

/** A street address built from the OSM `addr:*` tags, or `undefined` if none are set. */
function formatAddress(tags: Record<string, string>): string | undefined {
  const streetLine = [tags["addr:housenumber"], tags["addr:street"]]
    .filter((p): p is string => !!p)
    .join(" ");
  const parts = [streetLine, tags["addr:city"]].filter((p): p is string => !!p && p.length > 0);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Maps one Overpass element to a {@link Place}, or `null` when it carries no
 * usable position (a node always has `lat`/`lon`; a way/relation only does
 * when queried with `out center`, as {@link buildQuery} does).
 */
export function parseOverpassElement(el: OverpassElement): Place | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat === undefined || lon === undefined) return null;

  const tags = el.tags ?? {};
  const name = tags.name?.trim() || tags["name:en"]?.trim() || "Mosque";
  const address = formatAddress(tags);

  return {
    id: `osm:${el.type}:${el.id}`,
    name,
    coordinates: { latitude: lat, longitude: lon },
    ...(address ? { address } : {}),
  };
}

export class OverpassPlacesProvider implements PlacesProvider {
  readonly #endpoint: string;
  readonly #fetch: FetchLike;

  constructor(endpoint: string = DEFAULT_OVERPASS_ENDPOINT, fetchFn: FetchLike = fetch) {
    this.#endpoint = endpoint;
    this.#fetch = fetchFn;
  }

  async nearbyMosques(coords: Coordinates, radiusMeters: number): Promise<readonly Place[]> {
    const res = await this.#fetch(this.#endpoint, {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        "user-agent": "UmmahLibrary/1.0 (+https://ummahlibrary.org; read-only Overpass client)",
      },
      body: buildQuery(coords, radiusMeters),
    });
    // Mirrors the sibling HTTP repositories (tafsir/hadith/translation-catalog):
    // a non-OK response or a malformed body degrades to "no results" rather than
    // throwing; a hard network failure (offline, DNS) still rejects the promise,
    // since `fetch` itself throws before a `Response` exists — the caller (the
    // `/api/v1/places/nearby` route) turns that into a distinct error response.
    if (!res.ok) return [];
    const data = (await res.json()) as Partial<OverpassResponse> | null;
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const places = elements.map(parseOverpassElement).filter((p): p is Place => p !== null);
    return sortByDistance(coords, places);
  }
}
