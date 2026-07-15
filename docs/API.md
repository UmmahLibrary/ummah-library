# Ummah Library API

A public API for the Quran text, translations, tafsir, hadith, and prayer/reading
tools. The `/api/v1` and `/api/trpc` surfaces below are **read-only, open CORS,
no auth** — free to use. **Please keep the source attributions** (see
[`packages/data/ATTRIBUTION.md`](../packages/data/ATTRIBUTION.md)).

The one exception is `POST /api/sync` — the opt-in, end-to-end-encrypted sync
exchange (ADR 0033). It sits outside `/api/v1`, requires a bearer id, is not
publicly cacheable, and isn't part of the versioned read-only surface; see
[Account sync](#account-sync-post-apisync) at the end of this doc.

Base URL: `https://ummahlibrary.org`

There are two equivalent surfaces for the read-only data:

- **REST** under `/api/v1` — static JSON, ideal for any client or `curl`.
- **tRPC** under `/api/trpc` — typed router for TypeScript clients.

---

## REST

OpenAPI spec: [`/api/v1/openapi.json`](https://ummahlibrary.org/api/v1/openapi.json) —
kept in sync with the table below.

`{number}` is a surah number `1`–`114`; `{aya}` is an ayah number within that
surah; `{edition}` is a translation id (from `/editions` or `/translations`);
`{collection}` / `{reciterId}` are plugin ids (from `/api/trpc/listHadithCollections`
/ `listReciters`, or `packages/data/plugins/`).

### Quran text & translations

| Method & path                                         | Returns                                       |
| ------------------------------------------------------ | --------------------------------------------- |
| `GET /api/v1/surahs`                                   | `{ count, surahs: Surah[] }`                  |
| `GET /api/v1/surahs/{number}`                          | `{ surah: Surah, ayahs: Ayah[] }` (Arabic)    |
| `GET /api/v1/surahs/{number}/ayahs/{aya}`               | `{ ayah: Ayah \| null, translation: TranslatedAyah \| null }` — pass `?edition=` to also resolve a translation for that ayah |
| `GET /api/v1/editions`                                  | `{ count, editions: Translation[] }` — the small, curated, **bundled** set (static) |
| `GET /api/v1/surahs/{number}/translations/{edition}`    | `{ surah, edition, ayahs: TranslatedAyah[] }` — bundled edition (static, prerendered) |
| `GET /api/v1/translations`                               | `{ count, translations: Translation[] }` — the full **~490-edition runtime catalogue** ([ADR 0011](../docs/adr/0011-translation-catalog-runtime.md)) |
| `GET /api/v1/translations/{edition}/surahs/{number}`     | `{ surah, edition, ayahs: TranslatedAyah[] }` — runtime-catalogue edition (dynamic, fetched from `fawazahmed0/quran-api`); same shape as the bundled route above, path segments reversed |
| `GET /api/v1/search/corpus`                              | `{ count, verses: { s, a, t }[] }` — full Arabic corpus, powers client-side search |

### Tafsir

| Method & path                                          | Returns                                       |
| -------------------------------------------------------- | --------------------------------------------- |
| `GET /api/v1/tafsirs`                                    | `{ count, tafsirs: { id, name, author, language, direction }[] }` |
| `GET /api/v1/surahs/{number}/tafsirs/{edition}`           | `{ surah, tafsir, entries: TafsirEntry[] }` — fetched at runtime per edition |

### Hadith

Ingested at build time ([ADR 0022](../docs/adr/0022-hadith-ingested-search.md)).
`{collection}` must be one of the six enumerated collections — an unknown id
gets Next's own 404, not a JSON error body.

| Method & path                                              | Returns          |
| -------------------------------------------------------------- | ----------------- |
| `GET /api/v1/hadith/{collection}`                                | `HadithCollection` — the full collection incl. its section index, returned as-is |
| `GET /api/v1/hadith/{collection}/sections/{section}`             | `HadithSection` — returned as-is |

### Reference data

| Method & path              | Returns                                       |
| --------------------------- | ---------------------------------------------- |
| `GET /api/v1/names`         | `{ count, names: DivineName[] }` — the 99 Names |
| `GET /api/v1/adhkar`        | `{ count, dhikr: Dhikr[] }` — the full morning + evening set (no occasion filter at REST level) |

### Prayer & recitation

| Method & path                                                       | Returns                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| `GET /api/v1/prayer-times?lat=&lng=&date=&method=&madhab=&hlr=`          | `{ coordinates, date, method, madhab, highLatitudeRule, timings: ExtendedPrayerTimings }` |
| `GET /api/v1/recitations/{reciterId}/surahs/{number}/timings`            | `SurahTiming` — word-level timings, returned as-is ([ADR 0036](../docs/adr/0036-bundled-word-level-data.md)); only reciter/surah pairs with bundled data exist, others get Next's own 404 |

`prayer-times` query params: `lat`/`lng` (numbers, required), `date`
(`YYYY-MM-DD`, required, strictly calendar-validated), `method` (optional,
default `MuslimWorldLeague`; one of the `CALCULATION_METHODS` ids — an
unrecognized value silently falls back to the default), `madhab` (optional;
only `"hanafi"` is recognized, anything else — including omitted — resolves to
`"shafi"`), `hlr` (optional, default `"none"`; one of the `HIGH_LATITUDE_RULES`
ids). Bad `lat`/`lng`/`date` → `400`.

### Reading plans

| Method & path                     | Returns                            |
| ----------------------------------- | ------------------------------------ |
| `GET /api/v1/plans/catalogue`       | `{ count, plans: PlanTemplate[] }` |

Reading **plans** expose only the catalogue. A reader's progress is
local-first device state (ADR 0006) that never leaves the device, so there are
no plan-progress endpoints — starting, advancing and re-pacing a plan all
happen client-side.

### Meta

| Method & path                | Returns             |
| ------------------------------ | --------------------- |
| `GET /api/v1/openapi.json`     | OpenAPI 3 document |

```bash
curl https://ummahlibrary.org/api/v1/surahs/2 | jq '.surah.englishName, (.ayahs | length)'
# "The Cow"
# 286
```

### Types

```ts
type Surah = {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  revelationPlace: "meccan" | "medinan";
  revelationOrder: number;
  ayahCount: number;
  rukus: number;
  hasBismillah: boolean;
};
type Ayah = { sura: number; aya: number; text: string };
type Translation = {
  id: string;
  name: string;
  author: string;
  language: string;
  direction: "rtl" | "ltr";
};
type TranslatedAyah = Ayah & { translationId: string };
type TafsirEntry = Ayah & { tafsirId: string };
type PlanTemplate = {
  id: string;
  name: string;
  tag: string; // short badge, e.g. "30 days"
  len: string; // cadence, e.g. "Juzʾ a day"
  desc: string;
  range: { unit: "juz" | "hizb" | "page" | "surah" | "ayah"; units: number[] };
  schedule: { kind: "fixed"; unitsPerDay: number } | { kind: "targetDate"; endDate: string };
};

type HadithReference = { book: number; hadith: number };
type Hadith = {
  collectionId: string;
  number: number;
  text: string;
  grades: string[];
  reference: HadithReference;
};
type HadithSection = { collectionId: string; section: number; name: string; hadiths: Hadith[] };
type HadithCollection = {
  collectionId: string;
  name: string;
  sections: Record<string, string>; // section number (as string key) -> section name
  hadiths: Hadith[];
};

type DivineName = {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  description: string;
  references: string[]; // e.g. ["1:3", "17:110"]
};
type Dhikr = {
  id: string;
  order: number;
  occasions: ("morning" | "evening")[];
  arabic: string;
  translation: string;
  transliteration: string;
  repeat: number;
  repeatLabel: string;
  virtue?: string;
  source?: string;
};

type Coordinates = { latitude: number; longitude: number };
type PrayerTimings = {
  // ISO-8601 UTC instants
  fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string;
};
type ExtendedPrayerTimings = PrayerTimings & {
  imsak: string; midnight: string; lastThird: string; // ISO-8601 UTC instants
};

type WordTiming = [wordIndex: number, startMs: number, endMs: number];
type SurahTiming = {
  reciterId: string;
  surah: number;
  ayahs: Record<number, WordTiming[]>; // ayah number -> that ayah's word timings, in order
};
```

---

## tRPC

Endpoint: `/api/trpc`. Procedures (all queries — no mutations on this router):

| Procedure               | Input                             | Returns                                |
| ------------------------ | ----------------------------------- | ---------------------------------------- |
| `listSurahs`             | —                                    | `Surah[]`                              |
| `getSurah`                | `{ number }`                         | `{ surah, ayahs } \| null`             |
| `listEditions`            | —                                    | `Translation[]`                        |
| `getTranslation`          | `{ edition, number }`                | `TranslatedAyah[]`                     |
| `listPlanTemplates`       | —                                    | `PlanTemplate[]`                       |
| `listReciters`            | —                                    | `ReciterPlugin[]`                      |
| `listTafsirs`             | —                                    | `TafsirPlugin[]`                       |
| `getTafsir`               | `{ tafsir, number }`                 | `TafsirEntry[]` (empty if unresolved)  |
| `listHadithCollections`   | —                                    | `HadithPlugin[]`                       |
| `getHadithSection`        | `{ collection, section }`            | `HadithSection \| null`                |

Unlike the REST `/api/v1/tafsirs`, `listTafsirs`/`listReciters`/`listHadithCollections`
return the **full plugin objects**, not the trimmed REST subset:

```ts
type ReciterPlugin = {
  id: string; name: string; language: string; enabled?: boolean; kind: "reciter";
  style?: string;
  audioUrlTemplate: string;   // {surah} / {ayah}, or zero-padded {surah:3}{ayah:3}
  quranComId?: number;        // present only if word-timing is available (ADR 0036)
};
type TafsirPlugin = {
  id: string; name: string; language: string; enabled?: boolean; kind: "tafsir";
  author: string;
  direction: "rtl" | "ltr";
  surahUrlTemplate: string;   // contains {surah}
};
type HadithPlugin = {
  id: string; name: string; language: string; enabled?: boolean; kind: "hadith";
  direction: "rtl" | "ltr";
  collection: string;          // collection slug used in URLs, e.g. "eng-bukhari"
  sectionUrlTemplate: string;  // contains {section}
};
```

The `AppRouter` type is exported from `@ummahlibrary/api` for end-to-end type
safety in TypeScript clients:

```ts
import type { AppRouter } from "@ummahlibrary/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "https://ummahlibrary.org/api/trpc" })],
});

const surahs = await trpc.listSurahs.query();
const { surah, ayahs } = (await trpc.getSurah.query({ number: 2 }))!;
```

Quick check over HTTP:

```bash
curl 'https://ummahlibrary.org/api/trpc/getSurah?input=%7B%22number%22%3A2%7D'
```

---

## Account sync — `POST /api/sync`

The single runtime endpoint behind opt-in, end-to-end-encrypted cross-device
sync ([ADR 0033](../docs/adr/0033-account-sync.md)). It is **not** part of the
`/api/v1`/`/api/trpc` read-only surface: no CORS header, always
`cache-control: no-store`, and it requires auth.

- **Auth**: `Authorization: Bearer <accountId>` — a 64-hex-char opaque id
  derived client-side from the user's recovery phrase. Not a login/session
  token; the server never sees the phrase or plaintext data.
- **Body**: `{ entries: SyncEntry[] }`, where each entry is an encrypted,
  timestamped blob: `{ id, nonce, ciphertext: string | null, hlc: { millis, counter, node } }`.
- **Behavior**: merges the posted entries with whatever's stored for that
  account (last-writer-wins by Hybrid Logical Clock), persists, and returns
  the converged set as `{ entries: SyncEntry[] }`. The server authenticates
  and stores opaque ciphertext — it never decrypts anything.

Not something a third-party client should call directly; it exists for
Ummah Library's own web/mobile clients to exchange encrypted device state.
