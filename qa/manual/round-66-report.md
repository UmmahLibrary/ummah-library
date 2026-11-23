# Manual E2E QA — Round 66 (2026-11-23)

Input validation and edge inputs on the production build: the custom reading
plan form and the Go to box.

## Findings

None this round.

## Investigated, no bug found

- **Custom plan form:** the "Finish the Quran by" date field is wrapped in its
  `<label>` (so it has an accessible name), has `min` = today, and the empty
  state shows "Pick a valid end date." as a muted hint (not an error colour);
  Start plan is disabled until the draft validates.
- **Go to, from Al-Kahf (110 āyāt):** `٢:٢٥٥`, `  2 : 255  `, `الكهف ١٠`,
  `yasin`, `ya-sin 83`, `page 604`, `juz 30`, `hizb 60` all resolve to the
  right place; `kahf 200`, `0:0`, `2:0`, `-5`, `page 0`, `hizb 61`, `115` and
  `111` (a bare number beyond this surah's 110 āyāt) don't match and leave the
  "Also understands…" hint (Enter then shows "not a place in the Quran",
  round 34).
- **Not run:** an axe-core scan. Loading axe from a CDN into the test tab was
  blocked by this session's safety checks, and adding it to the repository
  would change dependencies, so it was skipped. Rounds 51–53 and 63–65 covered
  headings, landmarks, names, labels, contrast and focus by hand instead.

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 1/3.
