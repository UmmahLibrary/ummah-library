// Render the shared Ummah Library mark (apps/web/public/icons/icon.svg) into the
// PNG sizes the extension manifest needs. Run with: pnpm --filter
// @ummahlibrary/extension icons
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, "../../web/public/icons/icon.svg");
const OUT = resolve(here, "../public/icons");
const SIZES = [16, 32, 48, 128];

await mkdir(OUT, { recursive: true });
for (const size of SIZES) {
  await sharp(SOURCE)
    .resize(size, size)
    .png()
    .toFile(resolve(OUT, `icon${size}.png`));
  console.log(`icon${size}.png`);
}
