/**
 * Render an ayah to a shareable image entirely client-side (no server, no
 * upload). Uses the bundled Amiri font for the Arabic. The palette is fixed
 * (independent of the app theme) so the image looks right wherever it's shared.
 */

const WIDTH = 1080;
const PAD = 88;
const BG = "#0b1f17";
const FG = "#eef3ef";
const MUTED = "#8fb3a3";
const ACCENT = "#3fae7d";

interface AyahImageInput {
  arabic: string;
  translations: string[];
  reference: string;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderAyahImage(input: AyahImageInput): Promise<Blob | null> {
  try {
    await document.fonts.load("64px Amiri");
    await document.fonts.load("32px Amiri");
  } catch {
    /* fall back to whatever is available */
  }

  const maxWidth = WIDTH - PAD * 2;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return null;

  const arLineHeight = 96;
  const trLineHeight = 46;

  measure.font = '600 64px Amiri, serif';
  measure.direction = "rtl";
  const arLines = wrap(measure, input.arabic, maxWidth);

  measure.font = "32px system-ui, sans-serif";
  measure.direction = "ltr";
  const trLines = input.translations.flatMap((t) => wrap(measure, t, maxWidth));

  const height =
    PAD * 2 +
    arLines.length * arLineHeight +
    (trLines.length ? 40 + trLines.length * trLineHeight : 0) +
    96;

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, WIDTH, 8);

  let y = PAD + 64;
  ctx.fillStyle = FG;
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  ctx.font = '600 64px Amiri, serif';
  for (const line of arLines) {
    ctx.fillText(line, WIDTH - PAD, y);
    y += arLineHeight;
  }

  if (trLines.length) {
    y += 24;
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    ctx.fillStyle = MUTED;
    ctx.font = "32px system-ui, sans-serif";
    for (const line of trLines) {
      ctx.fillText(line, PAD, y);
      y += trLineHeight;
    }
  }

  ctx.textAlign = "left";
  ctx.fillStyle = ACCENT;
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.fillText(input.reference, PAD, height - PAD + 10);
  ctx.textAlign = "right";
  ctx.fillStyle = MUTED;
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText("app.ummahlibrary.org", WIDTH - PAD, height - PAD + 10);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** Share the image via the Web Share API if possible, else download it. */
export async function shareOrDownload(blob: Blob, reference: string): Promise<void> {
  const file = new File([blob], `ummah-library-${reference.replace(":", "_")}.png`, {
    type: "image/png",
  });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Quran ${reference}` });
      return;
    } catch {
      /* user cancelled or share failed — fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
