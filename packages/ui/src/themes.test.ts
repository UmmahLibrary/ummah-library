import { describe, expect, it } from "vitest";
import { type Palette, type ThemeKey, noorThemes } from "./themes";

/** WCAG 2.x relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES: (keyof Palette)[] = ["bg", "bg2", "bgElev", "cardHi"];
const TEXT_TOKENS: (keyof Palette)[] = ["fg", "muted", "faint", "accent", "error"];

describe("Noor palettes — text contrast (ADR 0041: labels at 4.5:1 or better)", () => {
  for (const key of Object.keys(noorThemes) as ThemeKey[]) {
    const p = noorThemes[key];
    for (const token of TEXT_TOKENS) {
      it(`${key}: ${token} reads at 4.5:1 on every surface`, () => {
        for (const surface of SURFACES) {
          const ratio = contrast(p[token] as string, p[surface] as string);
          expect(ratio, `${token} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  for (const key of Object.keys(noorThemes) as ThemeKey[]) {
    it(`${key}: accentHi reads at 3:1 on every surface (large text, e.g. surah names)`, () => {
      const p = noorThemes[key];
      for (const surface of SURFACES) {
        expect(contrast(p.accentHi, p[surface] as string), surface).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
