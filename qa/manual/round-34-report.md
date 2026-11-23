# Manual E2E QA — Round 34 (2026-11-23)

New loop on the web app after PR #293 ("Readable for everyone…") was merged and
deployed. Rounds 1–33 predate that PR, so this round started on its new
surfaces: the first-run setup, the Today home, the reader (ayah actions, Go
to) — all in the **Arabic** interface to exercise right-to-left layout.

## Findings

### 1. Header Hijri date is Latin and scrambled in Arabic/Urdu — FIXED

- **Where:** [TopBar.tsx](../../apps/web/src/components/shell/TopBar.tsx), [format.ts](../../apps/web/src/i18n/format.ts)
- **Symptom:** with the interface in Arabic the top bar read
  "Jumādā al-Ākhirah 1448 AH 12" — the Latin "12 … 1448 AH" string laid out
  right-to-left, so the day jumped to the end. The Gregorian line under it was
  already Arabic.
- **Root cause:** the top bar called core's `formatHijri()` (English month
  name, Latin digits) regardless of the interface language.
- **Fix:** new pure `formatHijriFor(date, locale)` in the web i18n helpers —
  Arabic month name + "هـ" for Arabic/Urdu, the locale's digits everywhere, and
  never a grouped year ("1,448"). The top bar uses it.
- **Verification:** live: header now reads "١٢ جمادى الآخرة ١٤٤٨ هـ".
- **Regression test:** `formatHijriFor` cases in
  [i18n.test.ts](../../apps/web/src/i18n/i18n.test.ts).

### 2. Go to: Enter on an unrecognised place does nothing — FIXED

- **Where:** [GoToSheet.tsx](../../apps/web/src/components/GoToSheet.tsx), [noor-everyone.css](../../apps/web/src/app/noor-everyone.css)
- **Symptom:** typing `2:999` and pressing Enter left the sheet unchanged — no
  "That isn't a place in the Quran" hint, no `aria-invalid`.
- **Root cause:** the submit button was `disabled` whenever the entry didn't
  parse. Browsers skip implicit (Enter) submission when the form's default
  button is disabled, so `submit()` — which sets `tried` and reveals the hint —
  never ran.
- **Fix:** the button is now `aria-disabled` (same dimmed style via CSS)
  instead of `disabled`, so Enter reaches `submit()`; navigation still only
  happens for a valid target.
- **Verification:** live in Arabic: Enter on `2:999` shows the not-found hint.
- **Regression test:** [GoToSheet.test.tsx](../../apps/web/src/components/GoToSheet.test.tsx)
  (fails on the old code, passes now).

### 3. Ayah "More" menu hidden behind the bottom dock; no Escape — FIXED

- **Where:** [AyahActions.tsx](../../apps/web/src/components/AyahActions.tsx)
- **Symptom:** on the last āyah(s) of a page the menu always opened downwards,
  behind the fixed Listen dock — only "Copy verse" was visible. Escape did not
  close it (every other reader popup closes on Escape).
- **Root cause:** fixed `top: 100%` positioning with no room check; no key
  handler.
- **Fix:** measure the button on open and open upwards when there's under
  340px below it; Escape closes; anchored with `insetInlineStart` so it extends
  the right way in RTL; rows are `role="menuitem"` and the button has
  `aria-haspopup`/`aria-expanded`.
- **Verification:** live on Al-Fātiḥa 1:7: menu opens upward fully visible;
  Escape closes it and focus stays on "More".
- **Regression test:** [AyahActions.test.tsx](../../apps/web/src/components/AyahActions.test.tsx)
  (Escape, upward vs downward placement, menu-item roles).

### 4. Ayah action feedback in English inside a translated reader — FIXED

- **Where:** [AyahActions.tsx](../../apps/web/src/components/AyahActions.tsx), all six message catalogues
- **Symptom:** in Arabic, "Verse copied", "Link copied", "Added to Hifz",
  "Preparing image…", the save panel's "No collections yet…", "New
  collection…", "Add", the note placeholder and the Play button's accessible
  name were English.
- **Fix:** 11 new `ayah.*` keys in every locale (first-pass, flagged for native
  review like the rest of wave 1). Also: "Preparing image…" now actually shows
  while the share image renders (it was gated on an unrelated toast).
- **Regression test:** the catalogue completeness test in `i18n.test.ts`
  enforces every locale carries the new keys with matching placeholders.

### 5. Arabic āyah counts ungrammatical for some numbers — FIXED

- **Where:** [ar.ts](../../apps/web/src/i18n/locales/ar.ts)
- **Symptom:** the surah list said "٧ آية" (3–10 needs the plural) while the
  reader and Go to said "٢٨٦ آيات" (11+ needs the singular).
- **Fix:** both now read "آياتها {n}" ("its āyāt: n"), correct for every count.

## Investigated, no bug found

- Every route returns 200, and bad parameters (`/surah/115`, `/juz/31`,
  `/page/605`, `/kids/999`, `/listen/0`, `/plans/nope`, `/blog/nope`) 404.
- Setup wizard: choosing a language advances, "Skip, use these settings" lands
  on Today with the language applied (`lang="ar" dir="rtl"`).
- Week dots on Today run right-to-left in Arabic (today is the left end) —
  correct for RTL.
- Reader position ("Āyah n of 7") tracks real scrolling.
- "Continue reading" on a finished surah resumes at its last āyah — matches
  `homeAction` design (resume where you left off).
- Verse of the day is a deterministic pick over all 6,236 āyāt; any curation
  would be an editorial/scholarly decision, not a bug.

## Verification

- `tsc --noEmit` (web) clean; eslint clean on changed files; prettier clean on
  changed files.
- Web vitest: 111 files / 529 tests passed before changes; new tests pass.
  (Local note: the hoisted `node_modules` gives `react-dom` the mobile app's
  React 19.1, so web tests here run with a local-only resolver hook pinning
  React to the web app's copy. CI is unaffected.)

## Verdict

5 real bugs found and fixed this round. Clean streak: 0/3.
