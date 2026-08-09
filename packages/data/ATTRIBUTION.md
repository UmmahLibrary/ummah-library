# Data attribution & licensing

The Quran is a sacred trust. Every dataset in `datasets/` carries its source
attribution, and these notices **must travel with the data** in any copy or
derivative — this is both a licensing requirement and an _amāna_.

> Repo-wide index (incl. runtime services & fonts): [`/ATTRIBUTION.md`](../../ATTRIBUTION.md).

All files in `datasets/` are **generated** by `scripts/ingest.ts`. Do not edit
them by hand; change the script and re-run:

```bash
pnpm --filter @ummahlibrary/data ingest
```

## Arabic text — `arabic-uthmani.json`

- **Source:** [Tanzil Quran Text](https://tanzil.net) (Uthmani), v1.1
- **License:** Creative Commons **Attribution 3.0** (CC-BY 3.0)
- **Required notice:**

  > Tanzil Quran Text  
  > Copyright (C) 2007–2024 Tanzil Project  
  > License: Creative Commons Attribution 3.0
  >
  > This copyright notice shall be included in all verbatim copies of the text,
  > and shall be reproduced appropriately in all files derived from or containing
  > a substantial portion of this text.
  >
  > Please check updates at: https://tanzil.net/updates/

The Basmala that Tanzil prepends to the first ayah of each surah (except 1 and 9)
is lifted out during ingestion and stored once on the edition as `bismillah`,
with a per-surah `hasBismillah` flag, so ayah text stays pure and aligns 1:1 with
the translations.

## Arabic text (IndoPak) — **not bundled** (runtime, display-only)

The IndoPak Arabic text is **not** in `datasets/` (ADR 0035 amendment, 2026-06-28).
Its source ([QUL resource 55](https://qul.tarteel.ai/resources/quran-script/55) /
Ayman Siddiqui) is **"Sadaqa-e-Jaria, do not redistribute"** with no FOSS licence,
and Tarteel's/quran.com's Terms forbid redistributing their content — so we may not
bundle it (per the rule at the top of this file). The reader fetches it **live from
quran.com for display only** (`word_fields=text_indopak`); see the runtime-services
section of the repo-wide [`/ATTRIBUTION.md`](../../ATTRIBUTION.md). A request to
license it for bundling is tracked in
[`docs/permissions/`](../../docs/permissions/word-by-word-data-request.md).

## Structure metadata — `surahs.json`, `structure.json`

- **Source:** Tanzil `quran-data.xml` (surah names, revelation place/order, ayah
  counts, juzʾ and Madani page boundaries). Same CC-BY 3.0 notice as above.

## Translations — `datasets/translations/`

Aggregated via [`fawazahmed0/quran-api`](https://github.com/fawazahmed0/quran-api),
which mirrors the upstream sources below. Each translation remains the copyright
of its author/publisher and is included under the upstream terms.

| File                     | Translation     | Author                   | Lang    | Upstream source                                |
| ------------------------ | --------------- | ------------------------ | ------- | ---------------------------------------------- |
| `eng-khattab.json`       | The Clear Quran | Mustafa Khattab          | English | Dr. Mustafa Khattab / Book of Signs Foundation |
| `urd-jalandhry.json`     | (Urdu)          | Fateh Muhammad Jalandhry | Urdu    | tanzil.net                                     |
| `urd-junagarhi.json`     | (Urdu)          | Muhammad Junagarhi       | Urdu    | tanzil.net                                     |
| `urd-ahmedali.json`      | (Urdu)          | Ahmed Ali                | Urdu    | tanzil.net                                     |
| `urd-tahirulqadri.json`  | Irfan-ul-Quran  | Muhammad Tahir-ul-Qadri  | Urdu    | irfan-ul-quran.com                             |
| `ben-muhiuddinkhan.json` | (Bengali)       | Muhiuddin Khan           | Bengali | tanzil.net                                     |

> **Note for maintainers:** translation copyright varies. Saheeh International was
> deliberately _excluded_ because its license does not permit free redistribution
> under AGPL-3.0. Before any production launch, confirm the redistribution terms
> of each translation above (per the project's scholar-/licensing-review
> guardrail). To swap or add a translation, edit the `TRANSLATIONS` list in
> `scripts/ingest.ts` — no other code changes required.

## Transliteration (runtime — #150)

The reader's per-āyah **Latin transliteration** line is **not bundled**. Like the
full translation catalogue (ADR 0011) it is fetched at runtime, by edition id,
from [`fawazahmed0/quran-api`](https://github.com/fawazahmed0/quran-api).

- **Edition:** `ara-quran-la` — a verbatim Latin transliteration of the Arabic.
- **Upstream source:** [Tanzil](https://tanzil.net).
- **License:** Creative Commons **Attribution 3.0** (CC-BY 3.0) — same notice as
  the Arabic text above. The transliteration is shown verbatim, attributed; no
  scholar review is required (mechanical romanisation, not interpretation).

## 99 Names of Allah — `asma.json`

- **Source:** the Names are from the **Qurʾān and Sunnah** (public domain). The
  Arabic, transliteration and English meaning are extracted at ingest time from
  the **[my-prayers/muslim-data](https://github.com/my-prayers/muslim-data-flutter)**
  dataset (`muslim_db` SQLite asset).
- **License:** **Apache-2.0** (compatible with AGPL-3.0; attribution retained).
- To re-source or add fields, change the asma step in `scripts/ingest.ts` (it
  downloads the SQLite asset and queries the `name` / `name_translation` tables).
- **Pending (maintainers):** a scholar may review the English meaning wording
  before a production launch, as with the other content datasets.

## Adhkar — `adhkar.json`

Two sources, both derived from **Ḥiṣn al-Muslim** (_Fortress of the Muslim_) by
Saʿīd ibn ʿAlī al-Qaḥṭānī, merged into one bundled collection (ADR 0016, #36):

- **Morning & evening** — [Seen-Arabic/Morning-And-Evening-Adhkar-DB](https://github.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB)
  (`en.json`). **License: MIT** (compatible with AGPL-3.0; attribution retained).
- **After-salah + the daily occasions** (waking, sleep, entering/leaving home,
  travel, eating, dressing, distress, and a "daily" catch-all for the source's
  remaining daily-occasion duas — entering/leaving the mosque, wuḍūʾ, rain,
  wind, sneezing, etc.) — [fitrahive/dua-dhikr](https://github.com/fitrahive/dua-dhikr)
  (`data/dua-dhikr/dhikr-after-salah/en.json` and `data/dua-dhikr/daily-dua/en.json`).
  **License: MIT** (compatible with AGPL-3.0; attribution retained). Each entry's
  `title` (e.g. "Travel Supplication") is folded into the `virtue` field, since
  `Dhikr` has no separate name field — see `scripts/ingest.ts`.

Each dhikr keeps its `source` (hadith/Quranic reference, with grading where the
upstream provides it) and its `repeat` count, parsed from the upstream `notes`
field for the dua-dhikr sets (e.g. `"Read 33x"`).

**Sourcing notes (#36):** other full Ḥiṣn al-Muslim JSON datasets were checked
and rejected for licensing — `wafaaelmaandy/Hisn-Muslim-Json` and
`iotmani/hisnul-muslim` carry no license (all-rights-reserved by default).
`asellam/HisnElMuslim` (MIT, the complete 133-chapter book) was a strong
candidate but is **Arabic-only** — no English translation or transliteration —
so using it would have meant authoring unreviewed translations ourselves,
which conflicts with the project's "established, attributed sources" rule; it
was passed over in favor of `fitrahive/dua-dhikr`, which already ships
Arabic + transliteration + translation in the same shape as the existing
source. Some classical Ḥiṣn al-Muslim chapters (e.g. funeral/burial duas, the
istikhāra prayer, illness/visiting-the-sick duas) are not yet covered by
`fitrahive/dua-dhikr`'s categories and so remain unadded; grow the adhkar step
in `scripts/ingest.ts` if/when a similarly-licensed, similarly-shaped source
for them turns up.

- **Pending:** a scholar should verify the Arabic vocalisation, translations, and
  gradings before any production launch (see ADR 0016).

## Hadith — `datasets/hadiths/`

- **Source:** [`fawazahmed0/hadith-api`](https://github.com/fawazahmed0/hadith-api),
  aggregating the English collections of **Ṣaḥīḥ al-Bukhārī, Ṣaḥīḥ Muslim, Sunan
  Abī Dāwūd, Jāmiʿ al-Tirmidhī, Sunan al-Nasāʾī** and **Sunan Ibn Mājah**.
- Each hadith keeps its `source` (upstream API + retrieval date). **Translation
  copyright varies per collection** — confirm redistribution terms before a
  production launch, as with the translations above.
- To add or swap a collection, edit the hadith step in `scripts/ingest.ts`.

## Recitation timings — `datasets/timings/`

- **Source:** [cpfair/quran-align](https://github.com/cpfair/quran-align) by Collin
  Fair (release `2016-11-24`) — word-by-word audio timing for each reciter,
  generated by forced alignment.
- **License:** the **data files are Creative Commons Attribution 4.0** (CC-BY-4.0)
  — the repo's _code_ is MIT, but the timing data is CC-BY-4.0 and the **attribution
  must travel with it** (compatible with AGPL-3.0). The repository's README states:
  _"These data files are licensed under a Creative Commons Attribution 4.0
  International License."_
- **What we ship:** one compact `{reciterId}/{surah}.json` per covered reciter —
  `[wordIndex, startMs, endMs]` per word — for the 7 reciters quran-align covers
  (Alafasy, Abdul Basit, Husary, Minshawi, Shatri, Shuraym, Sudais), matched by
  performance. **Al-Ghamdi is not covered** and keeps a live source. A pinned
  SHA-256 (`index.json` `checksum`) fails the ingest on any upstream drift.
- **Alignment:** quran-align splits words exactly as Tanzil's `quran-uthmani.txt`
  does, so word indices line up 1:1 with `arabic-uthmani.json`. Ayahs whose source
  alignment failed are skipped. See **ADR 0036**.

## Content plugins — `plugins/`

The manifests are bundled; the **content they point to is loaded from upstream**,
not stored in this repo.

- **Reciters** (`plugins/reciters/`) — recitation **audio streamed at runtime**
  from [everyayah.com](https://everyayah.com) and [quran.com](https://quran.com):
  Alafasy, Abdul Basit, Al-Minshawi, Al-Shuraim, As-Sudais, Al-Husary, Al-Ghamdi,
  Al-Shatri. No audio is redistributed by this repo.
- **Tafsirs** (`plugins/tafsirs/`) — Tafsīr al-Muyassar (King Fahd Complex),
  Tafsīr al-Ṭabarī, Tafsīr Ibn Kathīr (English/Urdu/Bengali), Maʿārif-ul-Qurʾān
  (Muftī Muḥammad Shafīʿ). Each remains © its author/publisher.

---

For **runtime/external services** (the quran.com word-by-word popover, audio
hosts, web fonts) and the repo-wide index, see the top-level
[`/ATTRIBUTION.md`](../../ATTRIBUTION.md).
