/**
 * Reproducible Quran data ingestion (Phase 1, Step 1.1).
 *
 * Downloads canonical sources and writes versioned JSON into `datasets/`.
 * NEVER hand-edit the generated files — change this script and re-run:
 *
 *   pnpm --filter @ummahlibrary/data ingest
 *
 * Sources:
 *   - Arabic Uthmani text + structure metadata: Tanzil (CC-BY 3.0)
 *   - Translations: fawazahmed0/quran-api editions (per-edition provenance
 *     recorded from its editions.json `source`/`comments`).
 *
 * Output is validated (114 surahs, 6236 ayahs per edition) before writing.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AdhkarOccasion,
  ContentPlugin,
  Dhikr,
  DivineName,
  TranslationPlugin,
} from "@ummahlibrary/core";
import { validatePlugin } from "@ummahlibrary/core";

const DATA_VERSION = "1.0.0";
const TOTAL_SURAHS = 114;
const TOTAL_AYAHS = 6236;

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "datasets");
const PLUGINS_DIR = join(HERE, "..", "plugins");

const TANZIL_UTHMANI =
  "https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt&agree=true";
const TANZIL_METADATA = "https://tanzil.net/res/text/metadata/quran-data.xml";
const FAWAZ_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";
// Morning & evening adhkar from Ḥiṣn al-Muslim, MIT-licensed and pre-structured
// (Arabic + translation + transliteration + graded source). See ADR 0016.
const ADHKAR_SRC =
  "https://cdn.jsdelivr.net/gh/Seen-Arabic/Morning-And-Evening-Adhkar-DB@main/en.json";
// The 99 Names of Allah — Arabic from the Quran/Sunnah with transliteration +
// English meaning, from the Apache-2.0 muslim-data project (verified licence).
// See ATTRIBUTION.md. The data ships inside a SQLite asset.
const ASMA_DB =
  "https://raw.githubusercontent.com/my-prayers/muslim-data-flutter/main/assets/db/muslim_db_v2.7.0.db";

/** Load + validate the content plugin manifests in a subdirectory. */
function readPlugins(subdir: string): ContentPlugin[] {
  const dir = join(PLUGINS_DIR, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as ContentPlugin)
    .map((plugin) => {
      const errors = validatePlugin(plugin);
      if (errors.length) throw new Error(`Invalid plugin '${plugin.id}': ${errors.join(", ")}`);
      return plugin;
    });
}

/**
 * Assemble + write the runtime plugin registry from the manifests. Pure (no
 * network), so it can be regenerated on its own via `--plugins-only`. Reciters
 * are ordered with Alafasy (the reference reciter, word-by-word timed) first,
 * then alphabetically — a stable, predictable default and dropdown order.
 */
async function writePluginRegistry(): Promise<void> {
  const translations = readPlugins("translations").filter(
    (p): p is TranslationPlugin => p.kind === "translation",
  );
  const reciters = readPlugins("reciters").sort((a, b) =>
    a.id === "alafasy" ? -1 : b.id === "alafasy" ? 1 : a.name.localeCompare(b.name),
  );
  const allPlugins = [
    ...translations,
    ...reciters,
    ...readPlugins("tafsirs"),
    ...readPlugins("hadiths"),
  ];
  await writeJson("plugins.json", { version: DATA_VERSION, plugins: allPlugins });
}

interface Verse {
  sura: number;
  aya: number;
  text: string;
}

interface Surah {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  revelationPlace: "meccan" | "medinan";
  revelationOrder: number;
  ayahCount: number;
  rukus: number;
  /** Every surah opens with the Basmala except At-Tawbah (9). */
  hasBismillah: boolean;
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return res.text();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

interface SqliteDb {
  prepare(sql: string): { all(): Record<string, unknown>[] };
  close(): void;
}

/** Download a SQLite asset and open it read-only via Node's built-in `node:sqlite`. */
async function getSqlite(url: string): Promise<SqliteDb> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  const file = join(tmpdir(), `ul-ingest-${Date.now()}.db`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as {
    DatabaseSync: new (path: string, opts?: { readOnly?: boolean }) => SqliteDb;
  };
  return new DatabaseSync(file, { readOnly: true });
}

/** Extract `key="value"` attributes from a single flat XML tag. */
function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]!] = m[2]!;
  return out;
}

function tags(xml: string, name: string): Record<string, string>[] {
  const re = new RegExp(`<${name}\\b[^>]*/>`, "g");
  return [...xml.matchAll(re)].map((m) => attrs(m[0]));
}

function parseSurahs(xml: string): Surah[] {
  const surahs = tags(xml, "sura").map((a) => ({
    number: Number(a.index),
    name: a.name!,
    transliteration: a.tname!,
    englishName: a.ename!,
    revelationPlace: (a.type === "Medinan" ? "medinan" : "meccan") as Surah["revelationPlace"],
    revelationOrder: Number(a.order),
    ayahCount: Number(a.ayas),
    rukus: Number(a.rukus),
    hasBismillah: Number(a.index) !== 9,
  }));
  if (surahs.length !== TOTAL_SURAHS) {
    throw new Error(`Expected ${TOTAL_SURAHS} surahs, parsed ${surahs.length}`);
  }
  return surahs;
}

/** Segment a flat list of 6236 verse texts (mushaf order) into sura:aya. */
function segment(texts: string[], surahs: Surah[]): Verse[] {
  if (texts.length !== TOTAL_AYAHS) {
    throw new Error(`Expected ${TOTAL_AYAHS} verse lines, got ${texts.length}`);
  }
  const verses: Verse[] = [];
  let cursor = 0;
  for (const s of surahs) {
    for (let aya = 1; aya <= s.ayahCount; aya++) {
      verses.push({ sura: s.number, aya, text: texts[cursor++]!.trim() });
    }
  }
  return verses;
}

async function writeJson(relPath: string, value: unknown): Promise<void> {
  const file = join(OUT, relPath);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value), "utf8");
  console.log(`  ✓ ${relPath} (${(JSON.stringify(value).length / 1024).toFixed(0)} KB)`);
}

interface EditionMeta {
  name: string;
  author: string;
  language: string;
  source?: string;
  comments?: string;
  link?: string;
}

async function main(): Promise<void> {
  console.log("Ingesting Quran data → datasets/\n");

  // Fast path: regenerate only plugins.json from the manifests (no network) —
  // used when adding a translation/reciter/tafsir/hadith manifest.
  if (process.argv.includes("--plugins-only")) {
    await writePluginRegistry();
    console.log("Regenerated plugins.json from manifests.\n");
    return;
  }

  // 1) Structure metadata (surahs, juz, pages) from Tanzil XML.
  console.log("• Tanzil structure metadata");
  const xml = await getText(TANZIL_METADATA);
  const surahs = parseSurahs(xml);
  const juz = tags(xml, "juz").map((a) => ({
    number: Number(a.index),
    sura: Number(a.sura),
    aya: Number(a.aya),
  }));
  const pages = tags(xml, "page").map((a) => ({
    number: Number(a.index),
    sura: Number(a.sura),
    aya: Number(a.aya),
  }));
  // Tanzil lists 240 quarters (rubʿ al-hizb); every 4th is a hizb start (60).
  const quarters = tags(xml, "quarter");
  const hizb = quarters
    .filter((_, i) => i % 4 === 0)
    .map((a, i) => ({ number: i + 1, sura: Number(a.sura), aya: Number(a.aya) }));

  await writeJson("surahs.json", {
    version: DATA_VERSION,
    source: "Tanzil quran-data.xml (https://tanzil.net)",
    surahs,
  });
  await writeJson("structure.json", {
    version: DATA_VERSION,
    source: "Tanzil quran-data.xml (https://tanzil.net)",
    totals: {
      surahs: TOTAL_SURAHS,
      ayahs: TOTAL_AYAHS,
      juz: juz.length,
      hizb: hizb.length,
      pages: pages.length,
    },
    juz,
    hizb,
    pages,
  });

  // 2) Arabic Uthmani text from Tanzil.
  console.log("• Tanzil Uthmani Arabic");
  const raw = await getText(TANZIL_UTHMANI);
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  const arabicVerses = segment(lines, surahs);

  // Tanzil prepends the Basmala to the first ayah of every surah except
  // Al-Fatiha (1, where it IS ayah 1) and At-Tawbah (9, which has none). Lift it
  // out so ayah text is pure and aligns 1:1 with the translations; the Basmala
  // is stored once on the edition and surfaced per-surah via `hasBismillah`.
  const bismillah = arabicVerses.find((v) => v.sura === 1 && v.aya === 1)!.text;
  // Surahs 95 & 97 render the Basmala in its waṣl form (an extra shadda on the
  // bāʾ: بِّسْمِ). Derive it from the standard form so matching stays exact.
  const bismillahWasl = bismillah[0]! + "ّ" + bismillah.slice(1);
  const prefixes = [bismillah, bismillahWasl];
  let stripped = 0;
  for (const v of arabicVerses) {
    if (v.sura === 1 || v.aya !== 1) continue;
    const prefix = prefixes.find((p) => v.text.startsWith(p));
    if (prefix) {
      v.text = v.text.slice(prefix.length).trimStart();
      stripped++;
    }
  }
  if (stripped !== TOTAL_SURAHS - 2) {
    throw new Error(
      `Expected to strip Basmala from ${TOTAL_SURAHS - 2} surahs, stripped ${stripped}`,
    );
  }

  await writeJson("arabic-uthmani.json", {
    version: DATA_VERSION,
    edition: {
      id: "ara-quranuthmani",
      name: "Tanzil Uthmani",
      language: "ar",
      direction: "rtl",
      source: "https://tanzil.net",
      license: "CC-BY-3.0",
    },
    bismillah,
    verses: arabicVerses,
  });

  // 3) Translation plugins → ingested into datasets (with provenance lookup).
  const translationPlugins = readPlugins("translations").filter(
    (p): p is TranslationPlugin => p.kind === "translation",
  );
  console.log(`• Translations (${translationPlugins.length} plugins)`);
  const editions = await getJson<Record<string, EditionMeta>>(`${FAWAZ_BASE}/editions.json`);
  const manifest: Record<string, unknown> = {};

  for (const t of translationPlugins) {
    const meta = Object.values(editions).find((e) => e.name === t.source);
    const data = await getJson<{ quran: { chapter: number; verse: number; text: string }[] }>(
      `${FAWAZ_BASE}/editions/${t.source}.json`,
    );
    if (data.quran.length !== TOTAL_AYAHS) {
      throw new Error(`${t.source}: expected ${TOTAL_AYAHS} verses, got ${data.quran.length}`);
    }
    const verses: Verse[] = data.quran.map((v) => ({
      sura: v.chapter,
      aya: v.verse,
      text: v.text,
    }));
    const edition = {
      id: t.id,
      name: t.name,
      author: t.author,
      language: t.language,
      direction: t.direction,
      sourceSlug: t.source,
      source: meta?.source ?? "https://github.com/fawazahmed0/quran-api",
      sourceComments: meta?.comments ?? null,
    };
    manifest[t.id] = { ...edition, ayahCount: verses.length };
    await writeJson(`translations/${t.id}.json`, { version: DATA_VERSION, edition, verses });
  }

  await writeJson("translations/index.json", {
    version: DATA_VERSION,
    arabic: "ara-quranuthmani",
    translations: manifest,
  });

  // 4) The full plugin registry (all kinds) for the app to load at runtime.
  await writePluginRegistry();

  // 5) Adhkar (morning & evening) — bundled content, small enough to ship.
  console.log("• Adhkar (Ḥiṣn al-Muslim — morning & evening)");
  const occasionsOf = (type: number): AdhkarOccasion[] =>
    type === 1 ? ["morning"] : type === 2 ? ["evening"] : ["morning", "evening"];
  const seen = await getJson<
    {
      content: string;
      translation: string;
      transliteration: string;
      count: number;
      count_description?: string;
      fadl?: string;
      source?: string;
      type: number;
    }[]
  >(ADHKAR_SRC);
  const adhkar: Dhikr[] = seen.map((it, i) => {
    const repeat = Number.isFinite(it.count) && it.count > 0 ? Math.floor(it.count) : 1;
    return {
      id: `me-${i + 1}`,
      order: i + 1,
      occasions: occasionsOf(it.type),
      arabic: it.content.trim(),
      translation: it.translation.trim(),
      transliteration: it.transliteration.trim(),
      repeat,
      repeatLabel: it.count_description?.trim() || (repeat > 1 ? `${repeat}×` : "Once"),
      virtue: it.fadl?.trim() || undefined,
      source: it.source?.trim() || undefined,
    };
  });
  if (adhkar.length < 30 || !adhkar.every((d) => d.arabic && d.translation)) {
    throw new Error(`Adhkar ingest looks wrong: ${adhkar.length} items`);
  }
  await writeJson("adhkar.json", {
    version: DATA_VERSION,
    source:
      "Seen-Arabic/Morning-And-Evening-Adhkar-DB (MIT), derived from Ḥiṣn al-Muslim by Saʿīd al-Qaḥṭānī",
    adhkar,
  });

  // 6) The 99 Names of Allah — bundled content from the muslim-data SQLite.
  console.log("• Asmāʾ al-Ḥusná (99 Names)");
  const asmaDb = await getSqlite(ASMA_DB);
  const asmaRows = asmaDb
    .prepare(
      `SELECT n._id AS number, n.name AS arabic, t.transliteration, t.translation AS meaning
       FROM name n JOIN name_translation t ON t.name_id = n._id
       WHERE t.language = 'en' ORDER BY n._id`,
    )
    .all() as { number: number; arabic: string; transliteration: string; meaning: string }[];
  asmaDb.close();
  const names: DivineName[] = asmaRows.map((n) => ({
    number: n.number,
    arabic: n.arabic.trim(),
    transliteration: n.transliteration.trim(),
    meaning: n.meaning.trim(),
    description: "",
    references: [],
  }));
  if (names.length !== 99 || !names.every((n) => n.arabic && n.transliteration && n.meaning)) {
    throw new Error(`Asma ingest looks wrong: ${names.length} names`);
  }
  await writeJson("asma.json", {
    version: DATA_VERSION,
    source:
      "The Names are from the Qurʾān & Sunnah; Arabic + transliteration + English meaning from my-prayers/muslim-data (Apache-2.0)",
    names,
  });

  console.log(
    `\nDone. ${surahs.length} surahs, ${arabicVerses.length} ayahs, ${translationPlugins.length} translations, ${allPlugins.length} plugins, ${adhkar.length} adhkar, ${names.length} names.`,
  );
}

main().catch((err: unknown) => {
  console.error("\nIngestion failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
