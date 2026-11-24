# Manual E2E QA — Round 74 (2026-11-24)

Iteration 6/100. Area: offline recitation downloads on the web — save Al-Ikhlāṣ
from the reader dock (Options → Save offline), see it on `/downloads`, delete it.

## Findings

### 1. One tap deleted a download with no confirmation — FIXED

- **Where:** [`DownloadsManager.tsx`](../../apps/web/src/components/DownloadsManager.tsx)
- **Symptom:** the × on a saved surah removed it at once; a misclick on a whole
  juzʾ or khatm download means re-downloading hundreds of MB. The mobile
  Downloads screen already asks "Remove {name} from this device?".
- **Fix:** the same question via `window.confirm`; Cancel keeps it.
- **Regression test:** new `DownloadsManager.test.tsx`.

### 2. The empty state pointed at a button that doesn't exist — FIXED

- **Symptom:** "tap the download button in the audio player" — on the web the
  action is **Options → Save offline**; there is no download button in the dock.
- **Fix:** the copy now names Options and Save offline.

## Investigated, no bug found

- Save offline shows 0% → 25% → 75% → "Saved offline"; `/downloads` lists
  "Al-Ikhlaas · Mishary Rashid Alafasy · 4/4 āyāt · 211 KB".
- A whole reader shell that looked scrolled up by 403px after opening Options
  turned out to be the testing tool scrolling an `overflow:hidden` container
  under an emulated viewport; a clean reload + click does not reproduce it.

## Verification

New test passes; web `tsc` and ESLint clean.

## Verdict

Two real issues, fixed.
