import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === "api" ? [] : sourceFiles(full);
    return /^(page|layout)\.tsx$/.test(name) ? [full] : [];
  });
}

describe("share previews", () => {
  // A url/title in the root layout's openGraph is inherited by every page that
  // doesn't set its own — og:url then sends scrapers to the home page.
  it("keeps page-specific fields out of the root layout's openGraph", () => {
    const layout = readFileSync(join(appDir, "layout.tsx"), "utf8");
    const og = layout.slice(layout.indexOf("openGraph:"), layout.indexOf("twitter:"));
    expect(og).not.toMatch(/\burl:|\btitle:/);
  });

  // A page's own openGraph replaces the inherited one, images included. (The
  // home page sits beside app/opengraph-image.tsx, so it keeps the file image.)
  it("re-lists the share image wherever a page sets its own openGraph", () => {
    const home = join(appDir, "page.tsx");
    const missing = sourceFiles(appDir).filter((f) => {
      const src = readFileSync(f, "utf8");
      return f !== home && /openGraph: \{[^}]*\btitle\b/s.test(src) && !src.includes("SHARE_IMAGE");
    });
    expect(missing).toEqual([]);
  });
});
