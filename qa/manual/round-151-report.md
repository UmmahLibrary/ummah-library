# Manual E2E QA — Round 151 (2026-11-24)

Iteration 83/100. Area: what "More → Copy verse" and the share image read from
the page, after round 143 added a "no translation" note.

## Findings

### 1. The "has no translation" note would be copied and shared as if it were the translation — FIXED

- **Where:** [`AyahActions.tsx`](../../apps/web/src/components/AyahActions.tsx) `readAyahText`
- **Symptom (from source, then test):** Copy verse and the share image collect
  each `.ayah-tr`'s text (dropping only the edition name). With round 143's note
  inside an `.ayah-tr`, copying 7:1 under Irfan-ul-Quran would have produced
  "المص / Irfan-ul-Quran has no translation for this āyah. / — 7:1".
- **Fix:** `.tr-missing` is removed from the clone like `.tr-name`; only real
  translations are copied or drawn.
- **Regression test:** `AyahActions.test.tsx` "copies the Arabic and real
  translations, never the 'no translation' note".

## Investigated, no bug found

Mobile copy/share builds its text from `translations.map(t => t.text)` — the
edition data, where a blank stays blank; the note is only display text.

## Verification

AyahActions tests 8/8; ESLint clean.

## Verdict

One real bug (introduced in round 143, caught before it shipped), fixed.
