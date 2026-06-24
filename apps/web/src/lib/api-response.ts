/** JSON response for the public REST API — open CORS, cacheable. */
export function apiJson(data: unknown, init?: ResponseInit): Response {
  const status = init?.status ?? 200;
  return Response.json(data, {
    ...init,
    headers: {
      "access-control-allow-origin": "*",
      // Only cache successes. Caching a 4xx would let a CDN/browser serve a
      // transient bad-param 400 — or a 404 that later resolves — for up to a day.
      "cache-control": status >= 400 ? "no-store" : "public, max-age=3600, s-maxage=86400",
      ...init?.headers,
    },
  });
}
