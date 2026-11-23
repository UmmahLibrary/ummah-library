/**
 * Reading comfort and app mode (ADR 0041) — the mobile mirror of web's
 * `lib/comfort-store.ts`. One small record under `ul.comfort` with the same
 * shape on both clients: translation size (the Arabic size stays on the
 * existing `ul.scale` setting), translation emphasis, larger buttons, reduced
 * motion, gentle habit tracking, and Easy mode.
 *
 * Pure: parsing and clamping only. Persistence lives in `comfort-store.ts`.
 *
 * None of these settings touch Quranic text shaping: Arabic size is a pure
 * font-size multiplier (line height scales with it), nothing else.
 */

export type AppMode = "standard" | "easy" | "kids";
export type ReadingPath = "arabic" | "translit" | "listen";
export type TrEmphasis = "equal" | "soft";

export interface Comfort {
  /** Translation size multiplier, independent of the Arabic size. */
  trScale: number;
  trEmphasis: TrEmphasis;
  /** Web-only today (Latin translation spacing); carried so a synced record round-trips. */
  dyslexia: boolean;
  reduceMotion: boolean;
  largeButtons: boolean;
  /** Classic "days in a row" counter; off by default (Home shows days this week). */
  showStreaks: boolean;
  /** Pause habit tracking without giving a reason. Progress is kept. */
  trackingPaused: boolean;
  readingPath: ReadingPath;
  mode: AppMode;
  setupDone: boolean;
}

/** Arabic size range (the existing `scale`). Only ever widened — never shrinks a saved size. */
export const AR_SCALE_MIN = 0.7;
export const AR_SCALE_MAX = 2.4;
/** Translation size range. */
export const TR_SCALE_MIN = 0.8;
export const TR_SCALE_MAX = 2.2;

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

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** One step of a size stepper: clamped to the range and rounded to one decimal. */
export function stepScale(value: number, delta: number, min: number, max: number): number {
  return Math.round(clamp(value + delta, min, max) * 10) / 10;
}

function pick<T>(x: unknown, ok: readonly T[], d: T): T {
  return ok.includes(x as T) ? (x as T) : d;
}

/** Parse a stored record defensively: unknown or corrupt fields fall back to defaults. */
export function parseComfort(raw: string | null | undefined): Comfort {
  if (!raw) return { ...DEFAULT_COMFORT };
  let v: Partial<Record<keyof Comfort, unknown>>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
      return { ...DEFAULT_COMFORT };
    v = parsed as Partial<Record<keyof Comfort, unknown>>;
  } catch {
    return { ...DEFAULT_COMFORT };
  }
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
}

/** Merge a patch onto a record and re-validate it (so a bad patch can't persist). */
export function mergeComfort(prev: Comfort, patch: Partial<Comfort>): Comfort {
  return parseComfort(JSON.stringify({ ...prev, ...patch }));
}

/**
 * Minimum touch-target height for a control: 48dp normally, larger when the
 * reader asked for larger buttons or is in Easy mode.
 */
export function targetSize(c: Pick<Comfort, "largeButtons" | "mode">): number {
  if (c.mode === "easy") return 64;
  return c.largeButtons ? 56 : 48;
}
