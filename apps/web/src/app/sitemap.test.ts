import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

// Pages that only show this device's own data (or are utility screens), so they
// have nothing for a search engine to index.
const PERSONAL = new Set([
  "/bookmarks",
  "/downloads",
  "/hifz/review",
  "/more",
  "/offline",
  "/profile",
  "/tracker",
]);

function staticPages(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory() || name.startsWith("[") || name === "api") continue;
    const route = `${base}/${name}`;
    try {
      statSync(join(full, "page.tsx"));
      out.push(route);
    } catch {
      /* a folder without its own page */
    }
    out.push(...staticPages(full, route));
  }
  return out;
}

describe("sitemap", () => {
  it("lists every public static page in the app", () => {
    const listed = new Set(sitemap().map((e) => new URL(e.url).pathname));
    const appDir = dirname(fileURLToPath(import.meta.url));
    const missing = staticPages(appDir).filter((r) => !PERSONAL.has(r) && !listed.has(r));
    expect(missing).toEqual([]);
  });

  it("lists each reading-plan template", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/plans/ramadan-khatm"))).toBe(true);
  });
});
