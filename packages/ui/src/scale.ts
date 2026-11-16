/**
 * Noor scale tokens (ADR 0042): type, spacing, radius, elevation, motion,
 * icon and touch-target sizes, shared by web, mobile and the extension.
 *
 * Palettes say *what colour*; these say *how big, how far apart, how round*.
 * Both apps used to pick these numbers on their own (about 35 font sizes and
 * 21 corner radii each), which is most of why web and mobile looked like two
 * products. One TypeScript source, two outputs:
 *   - mobile imports the numbers directly (`space[4]`, `type.body`);
 *   - web/extension read generated CSS custom properties (`--noor-space-4`),
 *     with font sizes in rem so the browser's text size still applies.
 *
 * Values were chosen from what the two apps already use most, so moving a
 * screen onto tokens changes it as little as possible.
 *
 * Quranic text keeps its own roles with tall line heights so stacked marks
 * never clip (React Native clips glyphs outside the line box). Changing a
 * Quran role's size never changes the font or the text.
 */

/** 4-point spacing grid with half steps; `space[n]` = n × 4 px. */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;
export type SpaceStep = keyof typeof space;

/** Corner radius by role: chips and tags, controls, cards, sheets, pills. */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;
export type RadiusStep = keyof typeof radius;

/** One step of the type ramp, in px. `tracking` is letter spacing in px. */
export interface TypeStyle {
  readonly size: number;
  readonly lineHeight: number;
  readonly weight: 400 | 500 | 600 | 700 | 800;
  readonly tracking?: number;
  readonly upper?: boolean;
}

/** Interface type ramp (Latin script). Arabic-script interface text uses the
 *  same sizes with taller lines: see `scriptLineHeight`. */
export const type = {
  display: { size: 30, lineHeight: 36, weight: 800 },
  title: { size: 24, lineHeight: 30, weight: 800 },
  heading: { size: 18, lineHeight: 24, weight: 700 },
  subheading: { size: 16, lineHeight: 22, weight: 700 },
  body: { size: 15, lineHeight: 23, weight: 400 },
  bodySm: { size: 14, lineHeight: 21, weight: 400 },
  label: { size: 13, lineHeight: 18, weight: 600 },
  caption: { size: 12.5, lineHeight: 17, weight: 500 },
  overline: { size: 12, lineHeight: 16, weight: 700, tracking: 1.2, upper: true },
} as const satisfies Record<string, TypeStyle>;
export type TypeRole = keyof typeof type;

/** Quranic text roles. Line height is 2× the size so harakāt above and below
 *  never touch or clip; the reader's own Arabic size setting multiplies both. */
export const quranType = {
  verse: { size: 28, lineHeight: 56 },
  sample: { size: 26, lineHeight: 52 },
  inline: { size: 22, lineHeight: 44 },
  title: { size: 34, lineHeight: 60 },
} as const;
export type QuranRole = keyof typeof quranType;

/** Line-height multipliers by script for interface text. Naskh needs more room
 *  than Latin; Nastaʿlīq (Urdu) needs the most because its words slope down. */
export const scriptLeading = {
  latin: 1.5,
  arabic: 1.65,
  nastaliq: 2.1,
} as const;
export type Script = keyof typeof scriptLeading;

/** Line height for a font size in a script, never shorter than the Latin
 *  ramp's own value for that role. Rounded to whole px for crisp layout. */
export function scriptLineHeight(size: number, script: Script, minimum = 0): number {
  return Math.max(minimum, Math.round(size * scriptLeading[script]));
}

/** Icon sizes. */
export const iconSize = { sm: 16, md: 20, lg: 24, xl: 28 } as const;

/** Minimum touch targets: WCAG 2.5.8 floor, default, and the large-buttons
 *  comfort setting. Easy mode uses `easy`. */
export const target = { min: 44, default: 48, large: 56, easy: 64 } as const;

/** Motion durations (ms) and the standard easing curve. Respect reduced
 *  motion on both platforms; these are the values when motion is on. */
export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  easing: [0.2, 0, 0, 1] as const,
} as const;

/** Elevation levels. `y`/`blur` drive the web shadow and the iOS shadow;
 *  `android` is Android's `elevation`. Colour comes from the theme. */
export const elevation = {
  flat: { y: 0, blur: 0, opacity: 0, android: 0 },
  card: { y: 1, blur: 3, opacity: 0.12, android: 1 },
  raised: { y: 4, blur: 12, opacity: 0.18, android: 4 },
  overlay: { y: 12, blur: 32, opacity: 0.28, android: 12 },
} as const;
export type ElevationLevel = keyof typeof elevation;

/** React Native text metrics for a type role. Weight is left to the caller,
 *  because native picks a face by family name (FONT.bold etc.), not weight. */
export function nativeText(
  role: TypeRole,
  script: Script = "latin",
): {
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: "uppercase";
} {
  const t: TypeStyle = type[role];
  return {
    fontSize: t.size,
    lineHeight: script === "latin" ? t.lineHeight : scriptLineHeight(t.size, script, t.lineHeight),
    ...(t.tracking !== undefined && script === "latin" && { letterSpacing: t.tracking }),
    // Arabic script has no case and letter spacing breaks joining.
    ...(t.upper && script === "latin" && { textTransform: "uppercase" as const }),
  };
}

/** React Native shadow style for an elevation level in a theme colour. */
export function nativeShadow(
  level: ElevationLevel,
  color = "#000",
): {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
} {
  const e = elevation[level];
  return {
    shadowColor: color,
    shadowOpacity: e.opacity,
    shadowRadius: e.blur / 2,
    shadowOffset: { width: 0, height: e.y },
    elevation: e.android,
  };
}

/** Control sizes shared by buttons and segmented controls, as token steps,
 *  so a button is the same size on web and mobile. */
export const control = {
  sm: { padY: 2, padX: 3.5, text: "label", radius: "sm", icon: "sm" },
  md: { padY: 3, padX: 5, text: "body", radius: "md", icon: "md" },
  lg: { padY: 3.5, padX: 8, text: "subheading", radius: "md", icon: "md" },
} as const satisfies Record<
  string,
  {
    padY: SpaceStep;
    padX: SpaceStep;
    text: TypeRole;
    radius: RadiusStep;
    icon: keyof typeof iconSize;
  }
>;

/** Segmented-control item sizes. */
export const segment = {
  sm: { padY: 1.5, padX: 3, text: "label", radius: "md" },
  md: { padY: 2, padX: 3.5, text: "bodySm", radius: "md" },
} as const satisfies Record<
  string,
  { padY: SpaceStep; padX: SpaceStep; text: TypeRole; radius: RadiusStep }
>;
