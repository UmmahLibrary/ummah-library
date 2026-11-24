import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return n.endsWith(".tsx") && !n.endsWith(".test.tsx") ? [full] : [];
  });
}

describe("Arabic text is marked as Arabic", () => {
  // Without lang="ar" the Quran text inherits the interface language: in the
  // Urdu UI a screen reader voiced the Arabic as Urdu (WCAG 3.1.2).
  it("every element styled .arabic or .noor-ar carries lang", () => {
    const missing: string[] = [];
    for (const f of tsxFiles(src)) {
      const text = readFileSync(f, "utf8");
      for (const m of text.matchAll(
        /<(\w+)\s[^>]*?className="[^"]*\b(?:arabic|noor-ar)\b[^"]*"[^>]*>/gs,
      )) {
        if (!/\blang=/.test(m[0])) {
          missing.push(`${f.slice(src.length)}:${text.slice(0, m.index).split("\n").length}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
