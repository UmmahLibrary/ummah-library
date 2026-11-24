import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(dir, "..", "app", "globals.css"), "utf8");

// Focus targets that are only ever focused from script (never by Tab), where the
// browser's ring would just be noise.
const SCRIPT_FOCUS_ONLY = new Set(["HifzReview.tsx"]);

describe("keyboard focus stays visible (WCAG 2.4.7)", () => {
  it("rings the wrapper of every input that turns its own outline off", () => {
    expect(css).toMatch(/\.noor-field:focus-within\s*\{[^}]*outline:/);
    const offenders = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx") && !SCRIPT_FOCUS_ONLY.has(f))
      .filter((f) => {
        const src = readFileSync(join(dir, f), "utf8");
        return (
          /outline: "none"/.test(src) &&
          !src.includes("noor-field") &&
          !src.includes("collection-name")
        );
      });
    expect(offenders).toEqual([]);
  });
});
