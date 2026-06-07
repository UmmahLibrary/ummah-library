# Data attribution & licensing

The Quran is a sacred trust. Every dataset in `datasets/` carries its source
attribution, and these notices **must travel with the data** in any copy or
derivative — this is both a licensing requirement and an _amāna_.

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

- **Source:** [Seen-Arabic/Morning-And-Evening-Adhkar-DB](https://github.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB)
  (`en.json`), itself derived from **Ḥiṣn al-Muslim** (_Fortress of the Muslim_)
  by Saʿīd ibn ʿAlī al-Qaḥṭānī.
- **License:** **MIT** (compatible with AGPL-3.0; attribution retained).
- Each dhikr keeps its `source` (hadith/Quranic reference, with grading where the
  upstream provides it) and its `repeat` count. To add the other Ḥiṣn al-Muslim
  sets (after-salah, sleep, travel, …) grow the adhkar step in `scripts/ingest.ts`.
- **Pending:** a scholar should verify the Arabic vocalisation, translations, and
  gradings before any production launch (see ADR 0016).
