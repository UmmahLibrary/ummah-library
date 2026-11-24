# Manual E2E QA — Round 119 (2026-11-24)

Iteration 51/100. Area: a blog article — headings, table of contents, code
blocks, external links.

## Findings

### 1. Sideways-scrolling code blocks couldn't be scrolled from the keyboard — FIXED

- **Where:** [`blog/CodeBlock.tsx`](../../apps/web/src/components/blog/CodeBlock.tsx)
- **Symptom:** `<pre style="overflow-x:auto">` with no tab stop: in browsers that
  don't make scrollers focusable themselves (Safari, older Chromium) the end of a
  long line was out of reach without a mouse (WCAG 2.1.1).
- **Fix:** `tabIndex={0}` and a name ("ts example").
- **Regression test:** `CodeBlock.test.tsx` "lets a keyboard reach a code block
  that scrolls sideways".

### 2. The table of contents showed the current section only by colour — FIXED

- **Where:** [`blog/ArticleTOC.tsx`](../../apps/web/src/components/blog/ArticleTOC.tsx)
- **Fix:** `aria-current="location"` on the active entry, matching the gold rule.

## Investigated, no bug found

One h1, h2 ids with `scroll-margin-top`, the external GitHub link has
`target="_blank" rel="noreferrer"` (implies noopener).

## Verification

Blog tests pass; `tsc`, ESLint clean.

## Verdict

Two small real accessibility bugs, fixed.
