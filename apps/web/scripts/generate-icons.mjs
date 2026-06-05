/**
 * Generate PWA icons from inline SVG sources. Run with: `pnpm --filter
 * @ummahlibrary/web icons`. Commits the PNGs in public/icons (they are static
 * assets); edit the SVGs here and re-run to change the mark.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const BG = "#0b0f0e";
const ACCENT = "#3fae7d";

// Rounded mark (manifest "any" + favicon): crescent + star on dark.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${BG}"/>
  <circle cx="248" cy="256" r="120" fill="${ACCENT}"/>
  <circle cx="298" cy="232" r="102" fill="${BG}"/>
  <circle cx="338" cy="320" r="17" fill="${ACCENT}"/>
</svg>`;

// Full-bleed mark (maskable + apple-touch): smaller, inside the safe area.
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <circle cx="244" cy="256" r="100" fill="${ACCENT}"/>
  <circle cx="286" cy="236" r="85" fill="${BG}"/>
  <circle cx="320" cy="312" r="14" fill="${ACCENT}"/>
</svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = {
    "icon-192.png": await png(rounded, 192),
    "icon-512.png": await png(rounded, 512),
    "maskable-512.png": await png(fullBleed, 512),
    "apple-icon-180.png": await png(fullBleed, 180),
  };
  for (const [name, buf] of Object.entries(files)) {
    await writeFile(join(OUT, name), buf);
    console.log(`  ✓ icons/${name} (${(buf.length / 1024).toFixed(1)} KB)`);
  }
  await writeFile(join(OUT, "icon.svg"), rounded, "utf8");
  console.log("  ✓ icons/icon.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
