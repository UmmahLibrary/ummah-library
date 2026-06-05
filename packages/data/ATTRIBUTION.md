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
