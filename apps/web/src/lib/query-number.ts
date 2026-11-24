/**
 * A numeric query parameter, or `NaN` when it is absent or blank.
 *
 * `Number(null)` and `Number("")` are both `0`, so reading a parameter with a
 * bare `Number(url.searchParams.get(...))` turns a *missing* latitude into the
 * equator and a missing radius into zero. Routing every read through here keeps
 * "not given" distinguishable from a real 0.
 */
export function numberParam(params: URLSearchParams, name: string): number {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return Number.NaN;
  return Number(raw);
}
