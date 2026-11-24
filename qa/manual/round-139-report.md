# Manual E2E QA — Round 139 (2026-11-24)

Iteration 71/100. Area: `POST /api/sync` with malformed requests.

## Findings

None this round.

## Investigated, no bug found

- Broken JSON → 400 `invalid JSON body`; no or malformed bearer account id →
  401; `OPTIONS` → 204 (extension preflight); `GET` → 405.
- The handler caps a push at 2,000 entries, 64 KB of ciphertext and 256-char
  nonces per entry, pages deltas at 1,000, and rate-limits per client IP. The
  raw body itself is read by `req.json()` without a size check; in production
  Vercel's 4.5 MB function-body limit bounds it, so it isn't an exposure there —
  worth an explicit check only if the endpoint is ever self-hosted.

## Verification

No code changes.

## Verdict

Clean.
