import { apiJson } from "../../../../lib/api-response";
import { SITE_URL } from "../../../../lib/site";

export const dynamic = "force-static";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Ummah Library API",
    version: "1.0.0",
    description: "Read-only public API for the Quran text and translations.",
    license: { name: "AGPL-3.0-only" },
  },
  servers: [{ url: `${SITE_URL}/api/v1` }],
  paths: {
    "/surahs": {
      get: {
        summary: "List all 114 surahs",
        responses: {
          "200": {
            description: "Surah list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    surahs: { type: "array", items: { $ref: "#/components/schemas/Surah" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/surahs/{number}": {
      get: {
        summary: "Get a surah with its Arabic ayahs",
        parameters: [
          {
            name: "number",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 114 },
          },
        ],
        responses: { "200": { description: "Surah + ayahs" }, "404": { description: "Not found" } },
      },
    },
    "/surahs/{number}/ayahs/{aya}": {
      get: {
        summary: "Get a single ayah (Arabic, plus a translation via ?edition=)",
        parameters: [
          {
            name: "number",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 114 },
          },
          { name: "aya", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
          { name: "edition", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Ayah (+ translation)" },
          "404": { description: "Not found" },
        },
      },
    },
    "/editions": {
      get: {
        summary: "List available translation editions",
        responses: { "200": { description: "Edition list" } },
      },
    },
    "/surahs/{number}/translations/{edition}": {
      get: {
        summary: "Get a surah's ayahs in one translation edition",
        parameters: [
          {
            name: "number",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 114 },
          },
          { name: "edition", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Translated ayahs" },
          "404": { description: "Not found" },
        },
      },
    },
    "/plans/catalogue": {
      get: {
        summary: "List the reading-plan catalogue (templates a reader can start)",
        responses: {
          "200": {
            description: "Plan templates",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    plans: { type: "array", items: { $ref: "#/components/schemas/PlanTemplate" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/tafsirs": {
      get: {
        summary: "List available tafsir editions",
        responses: { "200": { description: "Tafsir edition list" } },
      },
    },
    "/surahs/{number}/tafsirs/{edition}": {
      get: {
        summary: "Get a surah's tafsir entries in one edition",
        parameters: [
          {
            name: "number",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 114 },
          },
          { name: "edition", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Tafsir entries" },
          "404": { description: "Not found" },
        },
      },
    },
    "/translations": {
      get: {
        summary: "List the full runtime translation catalogue (~490 editions, ADR 0011)",
        responses: { "200": { description: "Translation catalogue" } },
      },
    },
    "/translations/{edition}/surahs/{number}": {
      get: {
        summary: "Get a surah's ayahs in one runtime-catalogue translation edition",
        parameters: [
          { name: "edition", in: "path", required: true, schema: { type: "string" } },
          {
            name: "number",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 114 },
          },
        ],
        responses: {
          "200": { description: "Translated ayahs" },
          "404": { description: "Not found" },
        },
      },
    },
    "/hadith/{collection}": {
      get: {
        summary: "Get a hadith collection, including its section index",
        parameters: [{ name: "collection", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Hadith collection" },
          "404": { description: "Not found" },
        },
      },
    },
    "/hadith/{collection}/sections/{section}": {
      get: {
        summary: "Get one section (book/chapter) of a hadith collection",
        parameters: [
          { name: "collection", in: "path", required: true, schema: { type: "string" } },
          { name: "section", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": { description: "Hadith section" },
          "400": { description: "Bad section number" },
          "404": { description: "Not found" },
        },
      },
    },
    "/names": {
      get: {
        summary: "List the 99 Names of Allah",
        responses: { "200": { description: "Divine names" } },
      },
    },
    "/adhkar": {
      get: {
        summary: "List the morning and evening adhkar",
        responses: { "200": { description: "Adhkar" } },
      },
    },
    "/prayer-times": {
      get: {
        summary: "Compute prayer times for a location and date",
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number" } },
          { name: "lng", in: "query", required: true, schema: { type: "number" } },
          { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } },
          {
            name: "method",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Calculation method id, default MuslimWorldLeague",
          },
          {
            name: "madhab",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["shafi", "hanafi"] },
          },
          {
            name: "hlr",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "High-latitude rule id, default none",
          },
        ],
        responses: {
          "200": { description: "Prayer times" },
          "400": { description: "Bad coordinates or date" },
        },
      },
    },
    "/recitations/{reciterId}/surahs/{number}/timings": {
      get: {
        summary: "Get word-level recitation timings for a reciter's surah",
        parameters: [
          { name: "reciterId", in: "path", required: true, schema: { type: "string" } },
          {
            name: "number",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 114 },
          },
        ],
        responses: {
          "200": { description: "Word timings" },
          "404": { description: "Not found" },
        },
      },
    },
  },
  components: {
    schemas: {
      Surah: {
        type: "object",
        properties: {
          number: { type: "integer" },
          name: { type: "string", description: "Arabic name" },
          transliteration: { type: "string" },
          englishName: { type: "string" },
          revelationPlace: { type: "string", enum: ["meccan", "medinan"] },
          revelationOrder: { type: "integer" },
          ayahCount: { type: "integer" },
          rukus: { type: "integer" },
          hasBismillah: { type: "boolean" },
        },
      },
      Ayah: {
        type: "object",
        properties: {
          sura: { type: "integer" },
          aya: { type: "integer" },
          text: { type: "string" },
        },
      },
      Translation: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          author: { type: "string" },
          language: { type: "string" },
          direction: { type: "string", enum: ["rtl", "ltr"] },
        },
      },
      TranslatedAyah: {
        type: "object",
        properties: {
          sura: { type: "integer" },
          aya: { type: "integer" },
          translationId: { type: "string" },
          text: { type: "string" },
        },
      },
      PlanTemplate: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          tag: { type: "string", description: 'Short badge, e.g. "30 days"' },
          len: { type: "string", description: 'Cadence label, e.g. "Juzʾ a day"' },
          desc: { type: "string" },
          range: {
            type: "object",
            properties: {
              unit: { type: "string", enum: ["juz", "hizb", "page", "surah", "ayah"] },
              units: { type: "array", items: { type: "integer" }, description: "Ordered 1-based unit indices" },
            },
          },
          schedule: {
            type: "object",
            description: "A fixed cadence or a target date",
            properties: {
              kind: { type: "string", enum: ["fixed", "targetDate"] },
              unitsPerDay: { type: "integer" },
              endDate: { type: "string", format: "date" },
            },
          },
        },
      },
    },
  },
} as const;

export async function GET() {
  return apiJson(spec);
}
