import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";

/**
 * Drift guard for the pre-hydration locale script (#208, ADR 0040).
 *
 * `app/layout.tsx` sets `<html lang>`/`<html dir>` from `localStorage` in an
 * inline script that runs before first paint, so an RTL locale doesn't visibly
 * flip after hydration. That script is a plain string — it cannot import
 * `config.ts`, so it carries its own copy of the direction map.
 *
 * Two copies of one fact drift. This test is the seam: add an RTL locale to
 * `LOCALES` without adding it to the script and the suite fails here, naming the
 * missing code, rather than shipping a locale that flashes LTR on every load.
 * Same pattern as the generated-theme-CSS drift test (ADR 0027).
 */
const layout = readFileSync(join(__dirname, "..", "app", "layout.tsx"), "utf8");

/** The `var rtl={ur:1,ar:1,…}` object literal from the inline script. */
function scriptRtlCodes(): Set<string> {
  const match = /var rtl=\{([^}]*)\}/.exec(layout);
  if (!match) throw new Error("pre-hydration locale script: `var rtl={…}` not found in layout.tsx");
  return new Set(
    match[1]!
      .split(",")
      .map((entry) => entry.split(":")[0]!.trim())
      .filter(Boolean),
  );
}

describe("pre-hydration locale script", () => {
  it("marks every RTL locale in LOCALES as RTL", () => {
    const inScript = scriptRtlCodes();
    const missing = LOCALES.filter((l) => l.dir === "rtl" && !inScript.has(l.code)).map(
      (l) => l.code,
    );
    expect(missing, `RTL locales missing from the inline script in layout.tsx: ${missing}`).toEqual(
      [],
    );
  });

  it("does not mark an LTR locale as RTL", () => {
    const inScript = scriptRtlCodes();
    const wrong = LOCALES.filter((l) => l.dir === "ltr" && inScript.has(l.code)).map((l) => l.code);
    expect(wrong, `LTR locales wrongly listed as RTL in layout.tsx: ${wrong}`).toEqual([]);
  });

  it("reads the same storage key the locale store writes", () => {
    expect(layout).toContain('localStorage.getItem("ul.locale")');
  });
});
