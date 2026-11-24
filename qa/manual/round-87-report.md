# Manual E2E QA — Round 87 (2026-11-24)

Iteration 19/100. Area: the 99 Names page — marking names, wording across
screens, and the list itself.

## Findings

### 1. Web said "1 / 99 marked" where mobile and Profile say "learned" — FIXED

- **Where:** [`AsmaView.tsx`](../../apps/web/src/components/AsmaView.tsx)
- **Symptom:** tapping a name shows "1 / 99 marked" — "marked" for what isn't
  said anywhere; mobile shows "1 of 99 learned" and the Profile "Names learned".
- **Fix:** "1 of 99 learned", matching both.
- **Regression test:** `AsmaView.test.tsx` updated to the new wording.

## Needs scholar review (not changed)

The bundled list (`packages/data/datasets/asma.json`, from my-prayers/muslim-data)
numbers **Allāh as #1** and has no **Al-Aḥad (ٱلْأَحَدُ)** between Al-Wāḥid and
Aṣ-Ṣamad, so it holds 98 of the 99 names in the at-Tirmidhī enumeration plus the
Name "Allāh". This is attributed religious content; per AGENTS.md it is not
edited here — flagged for `needs-scholar-review`.

## Investigated, no bug found

Marking toggles `aria-pressed` and persists to `ul.asmaLearned`; all 99 buttons
have names.

## Verification

AsmaView tests pass.

## Verdict

One wording inconsistency fixed; one content question raised for scholars.
