import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

const appDir = dirname(fileURLToPath(import.meta.url));

/** Source of the page and its own layout — where a route's metadata can live. */
function routeSource(route: string): string {
  const dir = join(appDir, ...route.split("/").filter(Boolean));
  return ["page.tsx", "layout.tsx"]
    .map((f) => join(dir, f))
    .filter((f) => existsSync(f))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
}

describe("page metadata", () => {
  // Without its own title a page shows just "Ummah Library" in the tab, in
  // history and in search results — indistinguishable from the home page.
  it("gives every public static page its own title", () => {
    const routes = sitemap()
      .map((e) => new URL(e.url).pathname)
      .filter((p) => p !== "/" && !/^\/(surah|juz|page|blog|plans)\/./.test(p));
    const untitled = routes.filter((r) => !/\btitle\b/.test(routeSource(r)));
    expect(untitled).toEqual([]);
  });

  it("gives every public static page a canonical URL", () => {
    const routes = sitemap()
      .map((e) => new URL(e.url).pathname)
      .filter((p) => p !== "/" && !/^\/(surah|juz|page|blog|plans)\/./.test(p));
    const missing = routes.filter((r) => !routeSource(r).includes("canonical"));
    expect(missing).toEqual([]);
  });
});
