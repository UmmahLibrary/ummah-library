# ADR 0018 — Local data backup: file export/import as the substitute for sync

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

All user state is local (ADR 0006): bookmarks, Hifz, reading goals, adhkar
tallies, preferences — keyed under `ul.*` in `localStorage`. The recurring ask is
**cross-device**, which normally means accounts + a server (Phase 4, #25), the
one thing the project deliberately doesn't have. Competitors (Quran Majeed,
Greentech) answer this without a backend by letting the user **export their data
to a file** and import it elsewhere.

## Decision

**Ship file export/import as the local-first substitute for sync.** A backup is a
versioned envelope (`{ app, version, exportedAt, data }`) wrapping the `ul.*`
entries verbatim. The envelope, validation, and merge are pure in `core/backup.ts`
(`buildBackup`, `validateBackup`, `mergeBackups`), unit-tested; the web layer
(`lib/backup.ts`) only collects `localStorage`, triggers a download, and applies
an uploaded file. Import offers **replace** (true restore) or **keep-mine**
(fill only missing keys). A `/settings` page hosts it, plus an "erase all data"
control. No network, no PII leaving the device.

## Consequences

- **Good:** users can move between devices, keep a safe backup, and fully delete
  their data — entirely offline, no account. It reinforces the local-first stance
  rather than eroding it, and it makes every present and future `ul.*` feature
  portable for free (the backup is key-agnostic).
- **Limit:** it's manual, not automatic real-time sync. If automatic multi-device
  sync is ever wanted, that remains the **accounts + backend** decision in #25;
  this backup format would become the seed/migration path for it.
- **Versioning:** the envelope carries a version; a newer-than-supported backup is
  refused rather than misapplied. Because values are stored verbatim, no per-key
  schema is needed here — each feature owns its own value format.
