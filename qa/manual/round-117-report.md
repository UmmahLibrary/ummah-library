# Manual E2E QA — Round 117 (2026-11-24)

Iteration 49/100. Area: round 116's missing-role bug across the whole mobile app
— every `<Pressable>` scanned for a role.

## Findings

### 1. 165 of 192 mobile Pressables were never announced as buttons — FIXED

- **Where:** [`apps/mobile/src/Type.tsx`](../../apps/mobile/src/Type.tsx)
- **Symptom (source scan):** only 27 Pressables set `accessibilityRole`. React
  Native gives a Pressable no role by default, so TalkBack/VoiceOver read its
  label ("Save", "Tafsir", "Juzʾ 30") with no "button" — nothing says it can be
  activated. Reader controls, Go to, Save to collection, Home cards, plan and
  tafsir controls were all affected.
- **Fix:** the app already routes React Native through `Type.tsx` (for fonts);
  it now exports a `Pressable` that defaults `accessibilityRole="button"`. An
  explicit `accessibilityRole` (the switches, checkboxes and radios) or `role`
  still wins. One central change instead of 165 edits, and new Pressables get
  it for free. (`ErrorBoundary.tsx` imports RN directly on purpose and keeps its
  explicit role.)

## Verification

mobile `tsc` clean; mobile suite 204/204; ESLint clean. Not run on a device or
emulator in this pass (no emulator session) — worth a TalkBack spot check.

## Verdict

One real accessibility bug (app-wide), fixed centrally.
