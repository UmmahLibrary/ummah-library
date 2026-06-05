/** JSON response for the public REST API — open CORS, cacheable. */
export function apiJson(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      ...init?.headers,
    },
  });
}
