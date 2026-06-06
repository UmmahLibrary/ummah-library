# Ummah Library API

A read-only public API for the Quran text and translations. No auth, open CORS,
free to use. **Please keep the source attributions** (see
[`packages/data/ATTRIBUTION.md`](../packages/data/ATTRIBUTION.md)).

Base URL: `https://app.ummahlibrary.org`

There are two equivalent surfaces:

- **REST** under `/api/v1` — static JSON, ideal for any client or `curl`.
- **tRPC** under `/api/trpc` — typed router for TypeScript clients.

---

## REST

OpenAPI spec: [`/api/v1/openapi.json`](https://app.ummahlibrary.org/api/v1/openapi.json)

| Method & path                                        | Returns                                       |
| ---------------------------------------------------- | --------------------------------------------- |
| `GET /api/v1/surahs`                                 | `{ count, surahs: Surah[] }`                  |
| `GET /api/v1/surahs/{number}`                        | `{ surah: Surah, ayahs: Ayah[] }` (Arabic)    |
| `GET /api/v1/editions`                               | `{ count, editions: Translation[] }`          |
| `GET /api/v1/surahs/{number}/translations/{edition}` | `{ surah, edition, ayahs: TranslatedAyah[] }` |
| `GET /api/v1/search/corpus`                          | `{ count, verses: { s, a, t }[] }` (full Arabic corpus, powers client-side search) |
| `GET /api/v1/openapi.json`                           | OpenAPI 3 document                            |

Tafsir, the runtime translation catalogue, and Hadith sections are also served
under `/api/v1` (fetched on demand by the reader); see the OpenAPI document for
the complete list.

`{number}` is `1`–`114`; `{edition}` is a translation id from `/editions`
(e.g. `eng-khattab`, `urd-jalandhry`, `ben-muhiuddinkhan`).

```bash
curl https://app.ummahlibrary.org/api/v1/surahs/2 | jq '.surah.englishName, (.ayahs | length)'
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
```

---

## tRPC

Endpoint: `/api/trpc`. Procedures (all queries):

| Procedure        | Input                 | Returns                    |
| ---------------- | --------------------- | -------------------------- |
| `listSurahs`     | —                     | `Surah[]`                  |
| `getSurah`       | `{ number }`          | `{ surah, ayahs } \| null` |
| `listEditions`   | —                     | `Translation[]`            |
| `getTranslation` | `{ edition, number }` | `TranslatedAyah[]`         |

The `AppRouter` type is exported from `@ummahlibrary/api` for end-to-end type
safety in TypeScript clients:

```ts
import type { AppRouter } from "@ummahlibrary/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "https://app.ummahlibrary.org/api/trpc" })],
});

const surahs = await trpc.listSurahs.query();
const { surah, ayahs } = (await trpc.getSurah.query({ number: 2 }))!;
```

Quick check over HTTP:

```bash
curl 'https://app.ummahlibrary.org/api/trpc/getSurah?input=%7B%22number%22%3A2%7D'
```
