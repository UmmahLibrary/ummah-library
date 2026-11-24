# Manual E2E QA — Round 92 (2026-11-24)

Iteration 24/100. Area: Settings → Erase all data — what it actually removes,
on web and mobile.

## Findings

### 1. "Erase all data" left sync on, so the next sync brought everything back — FIXED (web + mobile)

- **Where:** web [`lib/backup.ts`](../../apps/web/src/lib/backup.ts) /
  [`backup-store.ts`](../../apps/web/src/lib/backup-store.ts); mobile
  [`backup.ts`](../../apps/mobile/src/backup.ts) / [`backup-store.ts`](../../apps/mobile/src/backup-store.ts)
- **Symptom (from source, then test):** erase removes `ul.*` keys through
  `isBackupKey`, which deliberately excludes `ul.sync.*`. So the recovery secret,
  `ul.sync.enabled`, cursor and clocks all survived; with sync on, the next
  round re-pulled every bookmark and setting from the server — "can't be undone"
  was true in the wrong direction. The secret's IndexedDB wrapping key (web) /
  SecureStore entry (mobile) also stayed.
- **Fix:** erase now also turns sync off and removes every `ul.sync.*` key,
  resets the in-memory sync runtime, deletes the web key vault, and…

### 2. …downloaded recitations survived an erase — FIXED (web + mobile)

- **Symptom:** the Cache API store `ul-audio-v1` (web) and `Documents/ul-audio`
  (mobile) — often hundreds of MB — were untouched.
- **Fix:** `deleteAllAudio()` in each app's audio store, called by erase. The web
  confirmation now names "progress, settings, sync and downloaded recitations".

**Regression tests:** web `backup.test.ts` "also turns sync off and forgets its
state, and deletes downloaded audio"; mobile `backup-store.test.ts`
"clearSyncState removes every ul.sync.* key and nothing else".

## Verification

web backup/plan-store/DataBackup tests 20/20; mobile backup-store 6/6;
typecheck web + mobile; ESLint clean.

## Verdict

Two real bugs (privacy/data), fixed on both apps.
