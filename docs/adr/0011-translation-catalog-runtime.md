# ADR 0011 — Full translation catalogue + multi-tafsir, fetched at runtime

- **Status:** Accepted
- **Date:** 2026-06-06
- **Supersedes:** the delivery decision in [0010](0010-translation-selection.md) §3
  (render-all ingested translations) for the **full catalogue**.

## Context

[0010](0010-translation-selection.md) kept all translations **ingested** and
render-all'd, with an explicit trigger: once the catalogue grows past ~15
editions, move to **runtime fetch**. The product goal is now a Quran.com-scale
catalogue — the `fawazahmed0/quran-api` set is **~490 editions across ~98
languages** — which is far past that trigger. Bundling that as datasets is a
non-starter (0003 bundle weight). Tafsir is already runtime-fetched per edition
([0005](0005-content-plugin-system.md)), and the goal extends to several tafsirs
with a picker.

## Decision

**1. Translations move to a runtime catalogue behind the existing port.** A new
`HttpTranslationCatalog` adapter implements the unchanged
`TranslationRepository` port (0001 §2): `listTranslations()` reads
`fawazahmed0/quran-api` `editions.json` (cached per instance); `getSurahTranslation()`
fetches `editions/{slug}/{surah}.json` on demand. Wired in `api` as
`translationCatalog`, exposed at:

- `GET /api/v1/translations` — the full catalogue list.
- `GET /api/v1/translations/{edition}/surahs/{number}` — one edition's surah.

Both are `force-dynamic` (CDN-cached upstream + our `cache-control`).

**2. The ingested set stays as the static default.** The original
`FileTranslationRepository` + `/api/v1/editions` + the per-page render-all remain
for the **web reader's static-first** model (0003); the runtime catalogue is
**additive**. The web reader's migration to the catalogue (client-fetch the
selected editions) is a deliberate **follow-up**, not done here, so the static
reader is not destabilised.

**3. Mobile adopts the catalogue now.** Mobile is online-first (0009), so it reads
the full catalogue from `/translations` and fetches selected editions on demand —
no bundle cost. Its id-space is the **fawazahmed0 slug** (e.g.
`eng-mustafakhattaba`); the default edition is a slug.

**4. Grouping key.** fawazahmed0 exposes a full English **language name**
("English", "Urdu"), not an ISO code, and no per-edition display name (only the
slug + author). The adapter maps `language` to that name and uses the **author**
as the edition name; the pure `core` grouping/search (0010) operate on it, with
`displayLanguage` falling back to the name when it isn't a known code. Adding ISO
mapping + native scripts for the long tail is a later refinement.

**5. Multi-tafsir + picker.** Tafsir stays runtime-fetched via plugin manifests
(0005); more editions are added as manifests and listed at `GET /api/v1/tafsirs`.
Web and mobile gain a tafsir selector persisted to `ul.tafsir`. The spa5k entry
shape varies (numeric vs string `surah`/`ayah`), so the adapter coerces.

## Consequences

- A Quran.com-scale catalogue with **no bundle cost**; the port is unchanged, so
  the rest of the system is untouched.
- Two translation id-spaces coexist during migration: ingested ids (web static)
  and catalogue slugs (mobile + the new endpoints). This is intentional and
  temporary — closed when the web reader adopts the catalogue.
- Content is **online-only** (consistent with 0009); offline/curated subsets and
  the web reader migration are tracked follow-ups.
- New translation/tafsir sources are third-party; Islamic-content review
  (`needs-scholar-review`) still gates release.
