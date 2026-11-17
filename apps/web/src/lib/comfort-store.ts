/**
 * Reading comfort and app modes (ADR 0041). One small local record that the
 * whole web app reads: translation size (Arabic size stays on the existing
 * `scale` setting), translation emphasis, dyslexia-friendly spacing, reduced
 * motion, larger buttons, streak visibility, the reading path chosen at first
 * run, and Easy / Kids mode. Local-first: it lives on this device only.
 *
 * `applyComfort` writes it to <html> as CSS variables and classes. The same
 * mapping runs before first paint in the layout bootstrap (`COMFORT_BOOTSTRAP`)
 * so a large-text reader never sees a flash of small text.
 *
 * None of these settings touch Quranic text shaping: Arabic size is a pure
 * font-size multiplier, and the dyslexia preset applies only to Latin-script
 * translation text (`.ayah-tr:not([lang=ar]):not([lang=ur])…`), never to Arabic.
 */

export type AppMode = "standard" | "easy" | "kids";
export type ReadingPath = "arabic" | "translit" | "listen";
export type TrEmphasis = "equal" | "soft";

export interface Comfort {
  /** Translation size multiplier, independent of the Arabic size. */
  trScale: number;
  trEmphasis: TrEmphasis;
  dyslexia: boolean;
  reduceMotion: boolean;
  largeButtons: boolean;
  /** Classic day-streak counter; off by default (we show "days this week"). */
  showStreaks: boolean;
  /** Pause consistency tracking without giving a reason (illness, travel, menses). */
  trackingPaused: boolean;
  readingPath: ReadingPath;
  mode: AppMode;
  /** First-run comfort setup completed or skipped. */
  setupDone: boolean;
}

export const COMFORT_KEY = "ul.comfort";
export const COMFORT_EVENT = "ul.comfort";

export const TR_SCALE_MIN = 0.8;
export const TR_SCALE_MAX = 2.2;
export const AR_SCALE_MIN = 0.7;
export const AR_SCALE_MAX = 2.4;

export const DEFAULT_COMFORT: Comfort = {
  trScale: 1,
  trEmphasis: "equal",
  dyslexia: false,
  reduceMotion: false,
  largeButtons: false,
  showStreaks: false,
  trackingPaused: false,
  readingPath: "arabic",
  mode: "standard",
  setupDone: false,
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Parse a stored record defensively: unknown or corrupt fields fall back to defaults. */
export function parseComfort(raw: string | null): Comfort {
  if (!raw) return { ...DEFAULT_COMFORT };
  try {
    const v = JSON.parse(raw) as Partial<Comfort>;
    const pick = <T>(x: unknown, ok: readonly T[], d: T): T => (ok.includes(x as T) ? (x as T) : d);
    return {
      trScale:
        typeof v.trScale === "number" && Number.isFinite(v.trScale)
          ? clamp(v.trScale, TR_SCALE_MIN, TR_SCALE_MAX)
          : DEFAULT_COMFORT.trScale,
      trEmphasis: pick(v.trEmphasis, ["equal", "soft"] as const, "equal"),
      dyslexia: v.dyslexia === true,
      reduceMotion: v.reduceMotion === true,
      largeButtons: v.largeButtons === true,
      showStreaks: v.showStreaks === true,
      trackingPaused: v.trackingPaused === true,
      readingPath: pick(v.readingPath, ["arabic", "translit", "listen"] as const, "arabic"),
      mode: pick(v.mode, ["standard", "easy", "kids"] as const, "standard"),
      setupDone: v.setupDone === true,
    };
  } catch {
    return { ...DEFAULT_COMFORT };
  }
}

export function readComfort(): Comfort {
  try {
    return parseComfort(localStorage.getItem(COMFORT_KEY));
  } catch {
    return { ...DEFAULT_COMFORT };
  }
}

/** Reflect comfort settings onto <html> (CSS variables + classes). */
export function applyComfort(c: Comfort): void {
  if (typeof document === "undefined") return;
  const d = document.documentElement;
  d.style.setProperty("--tr-scale", String(c.trScale));
  d.classList.toggle("tr-soft", c.trEmphasis === "soft");
  d.classList.toggle("comfort-dyslexia", c.dyslexia);
  d.classList.toggle("comfort-reduce-motion", c.reduceMotion);
  d.classList.toggle("comfort-large", c.largeButtons || c.mode !== "standard");
  d.dataset.appMode = c.mode;
}

export function writeComfort(patch: Partial<Comfort>): Comfort {
  const next = parseComfort(JSON.stringify({ ...readComfort(), ...patch }));
  try {
    localStorage.setItem(COMFORT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — still apply for this session */
  }
  applyComfort(next);
  try {
    window.dispatchEvent(new CustomEvent(COMFORT_EVENT, { detail: next }));
  } catch {
    /* non-browser */
  }
  return next;
}

/** Same mapping as `applyComfort`, as a pre-paint inline script for layout.tsx. */
export const COMFORT_BOOTSTRAP = `try{var c=JSON.parse(localStorage.getItem("${COMFORT_KEY}")||"{}");
if(typeof c.trScale==="number")d.style.setProperty("--tr-scale",String(Math.min(${TR_SCALE_MAX},Math.max(${TR_SCALE_MIN},c.trScale))));
if(c.trEmphasis==="soft")d.classList.add("tr-soft");
if(c.dyslexia===true)d.classList.add("comfort-dyslexia");
if(c.reduceMotion===true)d.classList.add("comfort-reduce-motion");
if(c.largeButtons===true||c.mode==="easy"||c.mode==="kids")d.classList.add("comfort-large");
d.dataset.appMode=(c.mode==="easy"||c.mode==="kids")?c.mode:"standard";
}catch(e){}`;
