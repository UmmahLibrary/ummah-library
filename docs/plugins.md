# Content plugins

Adding a **translation**, **reciter**, or **tafsir** means adding one small JSON
manifest — no core or app code changes. Manifests live in
[`packages/data/plugins/`](../packages/data/plugins) and are validated and
registered automatically.

The contract is defined once in
[`packages/core/src/plugins.ts`](../packages/core/src/plugins.ts).

## Add a translation

Translations are **ingested** into the datasets at build time from
[fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api).

1. Find the edition slug in that project's `editions.json` (the `name` field).
2. Create `packages/data/plugins/translations/<your-id>.json`:

   ```json
   {
     "kind": "translation",
     "id": "fra-hamidullah",
     "name": "Hamidullah",
     "author": "Muhammad Hamidullah",
     "language": "fr",
     "direction": "ltr",
     "source": "fra-muhammadhamidullah"
   }
   ```

3. Re-ingest: `pnpm --filter @ummahlibrary/data ingest`. Your translation now
   appears in the reader and the API. Confirm the source's redistribution terms
   and update [`packages/data/ATTRIBUTION.md`](../packages/data/ATTRIBUTION.md).

## Add a reciter

Reciter audio is fetched at runtime from a URL template (`{surah}` / `{ayah}`,
with zero-padded forms like `{surah:3}`).

```json
{
  "kind": "reciter",
  "id": "husary",
  "name": "Mahmoud Khalil Al-Husary",
  "language": "ar",
  "style": "Murattal",
  "audioUrlTemplate": "https://everyayah.com/data/Husary_128kbps/{surah:3}{ayah:3}.mp3"
}
```

## Add a tafsir

Tafsir is fetched per-surah at runtime (e.g. from
[spa5k/tafsir_api](https://github.com/spa5k/tafsir_api)). `{surah}` is filled in.

```json
{
  "kind": "tafsir",
  "id": "ar-tabari",
  "name": "Tafsir al-Tabari",
  "author": "Muhammad ibn Jarir al-Tabari",
  "language": "ar",
  "direction": "rtl",
  "surahUrlTemplate": "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/ar-tafsir-al-tabari/{surah}.json"
}
```

After editing manifests, run the ingest once so `datasets/plugins.json` (the
registry the app loads) is regenerated. Islamic content is **scholar-reviewed**
before release — open a PR and tag it `needs-scholar-review`.
