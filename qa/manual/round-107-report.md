# Manual E2E QA — Round 107 (2026-11-24)

Iteration 39/100. Area: an automated accessibility sweep of 40 routes after the
round 69–106 changes — each page loaded in a same-origin iframe (1024×768) and
checked for buttons/links without an accessible name, form fields without a
label, images without `alt`, duplicate ids, and exactly one `<h1>` and `<main>`.

## Findings

None this round.

## Investigated, no bug found

- 39 of 40 routes: no issues (including the new Tafsir pickers, Search "Go to",
  Hijri grid `<ol>`, reading-goals chart list, Related links, Duʿā links).
- `/settings`: one unlabelled `<input type="file">` — it carries `hidden`
  (display:none), is never focusable, and is driven by the labelled
  "Import a backup" button. Not an issue.

## Verification

No code changes.

## Verdict

Clean.
