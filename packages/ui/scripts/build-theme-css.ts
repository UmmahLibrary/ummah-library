/**
 * Writes the generated Noor theme CSS from `themes.ts`. Run after changing a
 * palette value: `pnpm --filter @ummahlibrary/ui build:themes`.
 *
 * The committed outputs are guarded by `theme-css.test.ts`, so a stale checkout
 * fails CI.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { renderThemesCss, renderTokensCss } from "../src/theme-css";

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), "../src");

writeFileSync(resolve(srcDir, "noor-themes.css"), renderThemesCss());
writeFileSync(resolve(srcDir, "noor-tokens.css"), renderTokensCss());
console.log("Wrote src/noor-themes.css and src/noor-tokens.css from themes.ts");
