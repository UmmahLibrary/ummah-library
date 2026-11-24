# Manual E2E QA — Round 73 (2026-11-24)

Iteration 5/100. Area: end-to-end encrypted Sync setup in Settings (dev server,
which falls back to an in-memory sync store).

## Findings

### 1. Sync accepted any phrase, so strangers with the same weak phrase shared one account — FIXED

- **Where:** [`SyncSettings.tsx`](../../apps/web/src/components/SyncSettings.tsx),
  [`SyncSection.tsx`](../../apps/mobile/src/components/SyncSection.tsx) (mobile),
  [`SyncPanel.tsx`](../../apps/extension/src/SyncPanel.tsx) (extension)
- **Symptom:** typing `abc` and pressing Turn on sync succeeded ("Up to date").
- **Root cause:** the only check was "not empty". The account id and the
  encryption key both come from the secret through PBKDF2 with a **fixed** salt
  (`web-crypto-cipher.ts`), so everyone who types `abc` derives the same account
  and the same key — they would read and overwrite each other's bookmarks and
  settings.
- **Fix:** `isStrongRecoverySecret()` in
  [`core/recovery-phrase.ts`](../../packages/core/src/recovery-phrase.ts): a real
  12-word phrase, or ≥ 20 letters/digits after canonicalization (legacy 25-char
  codes still pass). All three apps disable Turn on sync and explain why
  (`aria-invalid` + described-by on web/extension; mobile string in six
  languages). ADR 0033 records the rule.
- **Verification:** live — `abc` shows the red hint and a disabled button;
  Generate clears it.
- **Regression tests:** `recovery-phrase.test.ts` (weak/strong cases),
  `SyncSettings.test.tsx` "refuses a guessable phrase that strangers could share".

## Investigated, no bug found

Empty phrase already disabled the button; Turn off sync asks first.

## Verification

core + web tests pass; typecheck of core, web, mobile, extension clean; ESLint clean.

## Verdict

One real (privacy) bug, fixed on all three clients.
