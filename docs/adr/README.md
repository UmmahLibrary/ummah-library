# Architecture Decision Records

These ADRs are the **canonical, high-level explanation of why the codebase is
the way it is** — the first thing to read before contributing (human or AI). Each
record is short: the problem, the decision, and what it costs us.

ADRs 0002–0009 were written together to document decisions already made and shipped
through Phases 1–3; later decisions get their own record at the time they're made.

| #                                             | Decision                                                                           | Status                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| [0001](0001-modular-monolith.md)              | Modular monolith with lint-enforced boundaries                                     | Accepted                                  |
| [0002](0002-quran-data-sourcing.md)           | Quran data: sourcing, reproducible ingestion, licensing                            | Accepted                                  |
| [0003](0003-static-first-delivery.md)         | Static-first delivery on Next.js / Vercel (no database)                            | Accepted                                  |
| [0004](0004-public-api.md)                    | Public API: static REST/OpenAPI + typed tRPC                                       | Accepted                                  |
| [0005](0005-content-plugin-system.md)         | Content plugin system (translations/reciters/tafsir/hadith)                        | Accepted                                  |
| [0006](0006-local-first-persistence.md)       | Local-first persistence — no accounts                                              | Accepted                                  |
| [0007](0007-hifz-spaced-repetition.md)        | Hifz scheduling: SM-2 in core behind a port                                        | Accepted                                  |
| [0008](0008-recitation-audio-highlighting.md) | Recitation audio + word-by-word highlighting                                       | Accepted                                  |
| [0009](0009-mobile-app.md)                    | Mobile app (Expo) sharing the monorepo                                             | Accepted                                  |
| [0010](0010-translation-selection.md)         | Translation selection: grouped, searchable, local-first                            | Accepted (§3 delivery superseded by 0011) |
| [0011](0011-translation-catalog-runtime.md)   | Full translation catalogue + multi-tafsir, runtime-fetched                         | Accepted                                  |
| [0012](0012-prayer-times.md)                  | Prayer times: adhan behind a port, computed on demand                              | Accepted                                  |
| [0013](0013-qibla.md)                         | Qibla: a pure great-circle bearing in `core`, no port                              | Accepted                                  |
| [0014](0014-hijri-calendar.md)                | Hijri calendar: tabular arithmetic in `core` + adjustment                          | Accepted                                  |
| [0015](0015-zakat.md)                         | Zakat: agreed monetary core in `core`, choice-points exposed                       | Accepted                                  |
| [0016](0016-adhkar.md)                        | Adhkar: bundled Ḥiṣn al-Muslim content + a pure counter                            | Accepted                                  |
| [0017](0017-adhkar-reminders.md)              | Adhkar reminders: pure windows off prayer times, in-app + local-notification reach | Accepted                                  |
| [0018](0018-local-data-backup.md)             | Local data backup: file export/import as the sync substitute                       | Accepted                                  |
| [0019](0019-prayer-reminders.md)              | Per-prayer reminders behind a `Notifier` port                                      | Accepted                                  |
| [0020](0020-prayer-tracker.md)                | Prayer tracker: a pure local prayer log, no port                                   | Accepted                                  |
| [0021](0021-global-search.md)                 | Global search: one client index over several sources                               | Accepted                                  |
| [0022](0022-hadith-ingested-search.md)        | Hadith ingested at build time, searched on the client                              | Accepted                                  |
| [0023](0023-noor-design-system.md)            | Noor design system: single source of truth across web and mobile                   | Accepted                                  |
| [0024](0024-local-storage-ports.md)           | Typed storage ports for local-first state (the sync seam)                          | Accepted                                  |
| [0025](0025-reading-plans.md)                 | Reading plans: pure schedule engine, catalogue bundled in core                     | Accepted                                  |
| [0026](0026-browser-extension.md)             | Browser extension: thin client over the public REST API                            | Accepted                                  |
| [0027](0027-generated-theme-css.md)           | Theme CSS generated from one token source (amends 0023)                            | Accepted                                  |
| [0028](0028-persistence-enforcement.md)       | Persistence behind store adapters is lint-enforced (amends 0024, 0001)             | Accepted                                  |
| [0029](0029-mobile-notifier.md)               | Mobile notifications: ExpoNotifier behind the Notifier port                        | Accepted                                  |
| [0030](0030-qada-tracker.md)                  | Qaḍāʾ tracker: missed-prayer backlog behind a store port                           | Accepted                                  |
| [0031](0031-haid-pause.md)                    | Ḥayḍ pause: menstrual pause preserves the prayer streak                            | Accepted                                  |
| [0032](0032-achievements.md)                  | Achievements: declarative badge engine over existing local data                    | Accepted                                  |
| [0033](0033-account-sync.md)                  | Cross-device sync: opt-in, E2E-encrypted, zero-PII (amends 0003, 0006)             | Accepted                                  |
| [0034](0034-fasting-qada.md)                  | Fasting qaḍāʾ: make-up fasts derived from the ḥayḍ pause ∩ Ramaḍān                 | Accepted                                  |
| [0035](0035-indopak-script.md)                | IndoPak Arabic script (text fetched live, not bundled — amended 2026-06-28)        | Accepted                                  |
| [0036](0036-bundled-word-level-data.md)       | Bundle recitation timings (quran-align, CC-BY); keep transliteration live          | Accepted                                  |
| [0037](0037-engineering-blog.md)              | Engineering blog: Markdown at build time, gated by frontmatter                     | Accepted                                  |
| [0038](0038-nearby-mosque-finder.md)          | Nearby mosque finder: OpenStreetMap behind a `PlacesProvider` port                 | Accepted                                  |
| [0039](0039-offline-reciter-audio.md)         | Offline reciter audio: `AudioStore` port; web Cache API (mobile follow-up)         | Accepted                                  |
| [0040](0040-ui-localization.md)               | UI localization: in-house typed i18n + RTL; nav slice + Urdu (foundation)          | Accepted                                  |

## Writing a new ADR

Copy an existing one. Keep it to **Context → Decision → Consequences**, number it
sequentially, and add a row above. Record the decision, not a tutorial — the code
is the tutorial. When a later decision supersedes an earlier one, mark the old one
`Superseded by NNNN` rather than deleting it.

## The load-bearing invariants (read these first)

- **Dependencies point inward** (0001): `apps → packages`, never the reverse;
  `core` depends on nothing and is enforced in CI.
- **`core` is pure** (0001, 0007): no framework, no DB, no network, no clock —
  everything is injected, everything is unit-tested.
- **Everything external sits behind a port** (0001): DB, AI, audio, content
  sources. Adapters are swappable; the app depends on the interface.
- **Data is reproducible and attributed** (0002): never hand-edit `datasets/`;
  change the ingest script and re-run; attribution travels with the data.
- **Static unless it can't be** (0003): prefer build-time generation; a runtime
  function is the exception, not the default.
