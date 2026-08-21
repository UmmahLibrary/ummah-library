# Manual E2E QA — Round 6 (2026-08-21)

Area covered this round: the Settings → data backup export/import round-trip
(`apps/web/src/lib/backup.ts`, `DataBackup.tsx`), end-to-end with a real generated
file, not just its own unit tests.

## Findings

None this round.

## Investigated, no bug found

- **Export → modify → import → reload round-trip:** exported a real backup (verified
  shape: `{app, version, exportedAt, data}`, 17 `data` keys), changed the theme
  locally, imported the backup back in, and confirmed after a reload the original
  theme was correctly restored. The in-app status message after import
  ("Restored 17 items. Reload to see everything.") is accurate — the import does not
  claim live reactivity it doesn't have; it explicitly tells the user a reload is
  needed, and a reload does pick it up correctly.
- **A self-inflicted false alarm caught before it became a report, noted for the
  record:** the first attempt at this test double-JSON-encoded a value before writing
  it into a synthetic backup file (`JSON.stringify('midnight')` instead of the raw
  string `'midnight'`), because `exportBackup()`/`importBackup()` in `backup.ts` store
  each `localStorage` value as its **raw string**, not JSON-encoded — matching how
  `ThemeToggle.test.tsx` asserts `localStorage.getItem("ul.theme")` directly against a
  plain string like `"ivory"`. The malformed test file imported successfully (`data`
  values aren't schema-validated per-key) and silently failed to apply visually,
  which looked exactly like an import bug until tracing `backup.ts`'s actual storage
  format showed the mismatch was in the test's own constructed file, not the app.
  Rebuilt the test with a real exported file's raw values and the round-trip worked
  correctly on the first clean attempt.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was needed
  beyond round 3's (last round with a code change), which remains green: lint 0
  errors, typecheck clean, 410/410 tests, clean build.
- All checks above were live re-verifications against the running dev server,
  including a real page reload to confirm post-import persistence.

## Verdict

Zero new bugs found — round 3 of the 3-in-a-row stop condition (following rounds 4
and 5). This satisfies the loop's stop condition.
