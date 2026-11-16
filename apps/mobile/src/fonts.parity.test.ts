import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NATIVE_FONT } from "@ummahlibrary/ui";

// The shared Noor parts pick fonts by family name (packages/ui native-fonts.ts).
// Those names must be exactly the families this app registers, or text falls
// back to the system font. fonts.ts imports font files, so read it as text.
const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "fonts.ts"), "utf8");

describe("shared native font names match the fonts this app loads", () => {
  for (const [key, family] of Object.entries(NATIVE_FONT)) {
    it(`${key} → ${family}`, () => {
      expect(source).toContain(`${key}: "${family}"`);
      expect(source).toContain(`  ${family},`);
    });
  }
});
