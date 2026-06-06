/**
 * Generate the app's launcher icon, Android adaptive foreground, and splash
 * image from a single vector mark, so the brand assets are reproducible rather
 * than hand-edited binaries. Run with: `node scripts/gen-assets.mjs`.
 *
 * Mark: a brand-green crescent + star on the app's dark background, matching the
 * reader's palette (--accent #3fae7d on #0b0f0e).
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// sharp is a transitive dev dependency in the pnpm store (not hoisted to the
// workspace root); resolve it from its isolated location.
const require = createRequire(import.meta.url);
const sharpEntry =
  process.env.SHARP_PATH ??
  join(process.cwd(), "node_modules/.pnpm/sharp@0.34.5/node_modules/sharp");
const sharp = require(sharpEntry);

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "..", "assets");

const ACCENT = "#3fae7d";
const BG = "#0b0f0e";

/** The crescent + star mark, drawn in a 1024×1024 viewport. */
function mark(scale = 1) {
  const cx = 512;
  const cy = 512;
  const r = 300 * scale;
  // Inner cut circle, offset right, carves the crescent via a mask.
  const ix = cx + 108 * scale;
  const iy = cy - 44 * scale;
  const ir = 250 * scale;
  // Five-pointed star tucked into the crescent's opening.
  const star = starPath(ix + 70 * scale, iy - 36 * scale, 78 * scale, 32 * scale);
  return `
    <defs>
      <mask id="crescent">
        <rect width="1024" height="1024" fill="black"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>
        <circle cx="${ix}" cy="${iy}" r="${ir}" fill="black"/>
      </mask>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${ACCENT}" mask="url(#crescent)"/>
    <path d="${star}" fill="${ACCENT}"/>
  `;
}

/** A five-pointed star path centred at (cx,cy) with outer/inner radii. */
function starPath(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

function svg({ background, scale }) {
  const bg = background ? `<rect width="1024" height="1024" fill="${BG}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg}${mark(scale)}</svg>`;
}

async function render(name, options) {
  const out = join(assets, name);
  await sharp(Buffer.from(svg(options))).png().toFile(out);
  console.log("wrote", name);
}

await Promise.all([
  // iOS / base launcher icon: full-bleed mark on the dark background.
  render("icon.png", { background: true, scale: 1 }),
  // Android adaptive foreground: transparent, mark shrunk into the safe zone.
  render("adaptive-icon.png", { background: false, scale: 0.66 }),
  // Splash: transparent mark, centred by Expo over the configured background.
  render("splash.png", { background: false, scale: 0.5 }),
]);
