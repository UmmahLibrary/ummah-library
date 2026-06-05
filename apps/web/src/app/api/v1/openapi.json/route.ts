import { apiJson } from "../../../../lib/api-response";

export const dynamic = "force-static";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Ummah Library API",
    version: "1.0.0",
    description: "Read-only public API for the Quran text and translations.",
    license: { name: "AGPL-3.0-only" },
  },
  servers: [{ url: "https://app.ummahlibrary.org/api/v1" }],
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
    },
  },
} as const;

export async function GET() {
  return apiJson(spec);
}
