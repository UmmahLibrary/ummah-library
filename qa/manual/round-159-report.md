# Manual E2E QA — Round 159 (2026-11-24)

Iteration 91/100. Area: the blog code block's Copy feedback, after round 157's
live-region fix in the reader.

## Findings

### 1. "Copied" on blog code blocks wasn't announced — FIXED

- **Where:** [`blog/CodeBlock.tsx`](../../apps/web/src/components/blog/CodeBlock.tsx)
- **Symptom:** the only feedback was the focused button's label changing from
  "Copy" to "Copied" for 1.4 s — a change most screen readers don't speak.
- **Fix:** an always-mounted, visually hidden `role="status"` beside it says
  "Code copied".
- **Regression test:** `CodeBlock.test.tsx` now also expects the status text.

## Verification

CodeBlock tests 3/3; ESLint clean.

## Verdict

One small real accessibility bug, fixed.
