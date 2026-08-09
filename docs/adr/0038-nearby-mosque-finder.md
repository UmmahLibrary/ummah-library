# ADR 0038 — Nearby mosque finder: OpenStreetMap behind a `PlacesProvider` port

- **Status:** Accepted
- **Date:** 2026-07-15

## Context

[#148](https://github.com/UmmahLibrary/ummah-library/issues/148) asks for a
nearby-mosque finder — a map/list of mosques near the device's location, with a
directions hand-off to the OS maps app. Both Athan/IslamicFinder and Muslim Pro
ship this; it fits our model because it needs only **on-device GPS** and a
**read-only public API** — no accounts, nothing stored server-side (0006).

**OpenStreetMap**, queried through its public **Overpass API**
(`overpass-api.de/api/interpreter`), is the obvious source: `amenity=place_of_
worship` + `religion=muslim` is a well-populated, community-maintained tag pair,
the endpoint is keyless, and there's no bulk-download/licensing tier to manage.
The data is **ODbL 1.0** — usable freely with attribution ("© OpenStreetMap
contributors"), which must **not** be buried in a footer.

This is the same shape of problem prayer times solved in
[0012](0012-prayer-times.md): an external, coordinate-driven lookup with no
accounts. The qibla precedent ([0013](0013-qibla.md)) also applies partway —
*distance between two points* is closed-form arithmetic, not an external
concern, so it belongs in `core` directly rather than round-tripping through the
vendor for something we can compute ourselves.

## Decision

**1. A `PlacesProvider` port in `core`**, mirroring `PrayerTimesCalculator`'s
shape: `nearbyMosques(coords, radiusMeters): Promise<readonly Place[]>`. A new
`Place` entity (`id`, `name`, `coordinates`, optional `address`) is added to
`entities.ts`. Distance/sorting/directions-link formatting are **not** part of
the port — they're closed-form, so they live in `core/geo.ts` directly
(`distanceKm`, `sortByDistance`, `formatDistanceKm`, `directionsUrl`), unit-tested,
no port, per the principle 0013 established.

**2. `OverpassPlacesProvider` in `packages/adapters`** is the only place that
talks to Overpass. It POSTs an Overpass QL query (`out center tags`, so ways and
relations resolve to a centroid, not just nodes) filtered to the given radius,
maps each element to a `Place` (falling back to a generic name/omitted address
when tags are sparse), and sorts nearest-first via `core`'s `sortByDistance`. A
non-OK response or malformed body degrades to `[]` — matching the sibling HTTP
repositories (`HttpTafsirRepository`, `HttpHadithRepository`,
`HttpTranslationCatalog`); a hard network failure (offline, DNS) still rejects,
so the caller can distinguish "nothing nearby" from "couldn't reach the search".

**3. Served by a dynamic REST route, not fetched by the client directly.**
`GET /api/v1/places/nearby?lat&lng&radius` (`force-dynamic`, mirroring
`/api/v1/prayer-times`) wraps `placesProvider.nearbyMosques`, clamps the radius
(200 m – 20 km) and result count (50), and lets the standard `apiJson` cache
headers absorb repeat traffic for the same area — a courtesy to the shared public
Overpass instance, and the reason the adapter's `User-Agent` header (Overpass's
usage policy asks automated clients to identify themselves) is set server-side,
where `fetch` allows it (browsers block overriding it). Both apps read this one
endpoint: the web page calls it directly; mobile adds `api.getNearbyMosques` next
to `api.getPrayerTimes`, the same "thin REST client" shape ADR 0004/0009 already
use for every other cross-platform lookup.

**4. Local-first UI reusing the existing location.** `/mosques` (web) and a
`Mosques` screen (mobile, registered in `ToolsStack` next to `Qibla`) both read
and write the **same** `ul.prayerCoords` key qibla and prayer times already use
(`PrayerSettingsStore`), so locating once serves all three features. A radius
chip row (2/5/10/20 km) re-queries; each result shows name, distance, address
(when tagged), and a **Directions** control built from `core`'s `directionsUrl`
— a keyless Google Maps URL opened via a plain `<a>` on web or
`Linking.openURL` on mobile, which resolves to the device's own maps app on
both platforms without a native maps SDK. The OSM attribution renders
unconditionally at the bottom of both finder screens, not gated behind a
successful search.

**5. List view for v1, no map.** Neither app bundles a map-rendering library
today; adding one solely for this feature would be a new dependency for a
"nice-to-have" the issue explicitly scopes as optional. A map view (e.g.
MapLibre, which needs no vendor key) is a clean follow-up behind the same port —
`PlacesProvider` doesn't change either way.

**Out of scope (explicitly, per the issue):** per-mosque Mawaqit jamāʿah/iqāmah
times — a possible follow-up, not built here.

## Consequences

- **Good:** fits the local-first model exactly — no accounts, no server-stored
  location history, one new swappable port. `core` stays pure; Overpass is the
  only vendor touched, and only from one adapter.
- **Good:** the shared-location convention (qibla/prayer-times/mosques all read
  `ul.prayerCoords`) means a reader who's already located themselves for prayer
  times sees mosques immediately, no second permission prompt.
- **Cost — coverage:** OSM mosque tagging is crowd-sourced and uneven by region;
  an empty result can mean "genuinely none nearby" or "not yet mapped". The UI
  says "no mosques found **within this radius**", not "there are no mosques
  here", and a wider-radius retry is one tap away.
- **Cost — list only:** no interactive map in v1 (see decision 5). Distance and
  address are enough to choose a destination; `Place`/`PlacesProvider` need no
  changes when a map view is added later.
- **Rate limits:** overpass-api.de is a shared community resource with informal
  fair-use limits. Routing every request through our own `force-dynamic` REST
  function (rather than each client hitting Overpass straight from the device)
  keeps the request pattern identifiable (one `User-Agent`) and cacheable
  (`apiJson`'s `s-maxage=86400`), rather than fan-out from every installed app.
