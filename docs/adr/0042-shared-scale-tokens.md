# 0042 — Shared scale tokens: one type ramp, spacing, radius, elevation and motion for web and mobile

- **Status:** Accepted
- **Date:** 2026-11-16
- **Builds on:** 0023 (Noor design system), 0027 (generated theme CSS), 0035 (IndoPak), 0040 (UI localization), 0041 (readable for everyone)

## Context

ADR 0023 made `packages/ui` the single source of truth for visual design, and
ADR 0027 generated the theme CSS from one TypeScript palette. In practice only
**colour** was shared. Every size was chosen per screen:

- **Font sizes:** about 35 distinct values in each app.
- **Corner radii:** about 21 distinct values in each app.
- **Padding:** 405 inline values on mobile.

A side-by-side review of the web app at phone width and the Android build found
the two apps read as different products even with identical palettes and fonts.

Research into how teams with both web and native apps stay consistent found the
same pattern in every case: they share a **foundation of tokens**, not pixels.
Examples are Spotify Encore, Microsoft Fluent 2, Uber Base and Shopify Polaris.
Navigation chrome, gestures, sheets and pickers stay native.

## Decision

Add **scale tokens** to `packages/ui/src/scale.ts`, in TypeScript, beside
`themes.ts`:

| Token                 | Values                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `space`               | 4-point grid with 2-point half steps (`space[4]` = 16)                                                            |
| `radius`              | `xs` 4, `sm` 8, `md` 12 (controls), `lg` 16 (cards), `xl` 20 (sheets), `pill`                                     |
| `type`                | interface ramp from `display` 30 to `overline` 12: size, line height, weight; no interface text below 12 px       |
| `quranType`           | Quranic roles with line height 2× size, so stacked marks never clip                                               |
| `scriptLeading`       | taller lines for Arabic-script interface text (Naskh 1.65×, Nastaʿlīq 2.1×); no case or tracking in Arabic script |
| `iconSize`, `target`  | icon sizes and touch targets (44 minimum, 48 default, 56 large buttons, 64 easy mode)                             |
| `motion`, `elevation` | motion durations, standard easing, and elevation levels                                                           |
| `control`, `segment`  | button and segmented-control sizes, expressed as token steps                                                      |

**One source, two outputs:**

- **Mobile** imports the numbers, plus `nativeText(role, script)` and
  `nativeShadow(level, color)`.
- **Web and the extension** read CSS custom properties (`--noor-space-4`,
  `--noor-text-body`, `--noor-radius-md`, …). These are generated into
  `noor-themes.css`/`noor-tokens.css` by the existing `build:themes` script and
  guarded by the drift test.
- Font sizes are emitted in **rem**, so the browser's text size and the
  large-screen rule scale them. Spacing and radius stay in px.
- `sp()`, `rad()`, `text()` and `shadow()` return the `var(--…)` references for
  inline styles.

Values were taken from what both apps already use most, so moving a screen onto
tokens changes it as little as possible. The shared `Btn` and `Seg` primitives
are the first users.

Quranic text is unaffected: a Quran role sets **size and line height only**,
never the font, the text or its marks.

## Consequences

- New UI code uses tokens instead of raw numbers. Existing screens move over in
  Phase 3, starting with the reader, the surah list, Home and Settings. A lint
  rule against raw sizes in apps comes after that migration, one screen at a
  time.
- Adding or changing a token is a one-line change in `scale.ts` followed by
  `build:themes`. Web, mobile and the extension all follow.
- We did not adopt a cross-platform styling framework (Tamagui, NativeWind,
  Unistyles). The gap was missing tokens, not tooling, and the `.tsx` +
  `.native.tsx` pattern already matches how larger systems work. Revisit only
  if token adoption fails to close the gap, with a new ADR.
- Not decided here, because each needs the owner's choice:
  - one tab bar across platforms;
  - one Quran face (Amiri on web, Amiri Quran on mobile);
  - Nastaʿlīq for the Urdu interface on mobile;
  - card or row lists.

## Addendum (2026-11-16): shared parts

Phase 2 added the parts both apps draw most, each as `Foo.tsx` +
`Foo.native.tsx` on these tokens:

- **Text:** the type ramp with tone and script.
- **Card**
- **SectionHeader:** icon tile, title and purpose line. Replaces mobile's
  uppercase labels.
- **ListRow**
- **Chip**
- **Stepper**
- **AyahBlock:** number, actions, Quranic text, translations. Layout only; the
  reader passes the Quranic text in already rendered.

Native parts take font family names from `native-fonts.ts`; a mobile test keeps
them equal to the families the app loads.

Two supporting changes:

- **Native files are type-checked.** `apps/mobile/tsconfig.json` sets
  `moduleSuffixes: [".native", ""]`, so `pnpm typecheck` checks
  `packages/ui/*.native.tsx` the way Metro resolves them. Before this, nothing
  checked them until bundling.
- **One React in the mobile bundle.** `metro.config.js` resolves `react`,
  `react-native` and `react-native-svg` from the app for every file.
  `packages/ui` keeps its own React as a test dev dependency. Metro picked that
  copy for files inside the package, so the first shared part with a hook
  crashed on Android ("Cannot read property 'useContext' of null").

First uses: Settings section headings and the text-size steppers, on web and
mobile.
