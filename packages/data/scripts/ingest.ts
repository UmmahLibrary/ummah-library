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
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_VERSION = "1.0.0";
const TOTAL_SURAHS = 114;
const TOTAL_AYAHS = 6236;

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "datasets");

const TANZIL_UTHMANI =
  "https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt&agree=true";
const TANZIL_METADATA = "https://tanzil.net/res/text/metadata/quran-data.xml";
const FAWAZ_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";

interface TranslationSpec {
  /** fawazahmed0 edition slug (the source file name). */
  slug: string;
  /** Stable internal id used as our file name + edition id. */
  id: string;
  language: string;
  name: string;
  author: string;
}

const TRANSLATIONS: readonly TranslationSpec[] = [
  {
    slug: "eng-mustafakhattaba",
    id: "eng-khattab",
    language: "en",
    name: "The Clear Quran",
    author: "Mustafa Khattab",
  },
  {
    slug: "urd-fatehmuhammadja",
    id: "urd-jalandhry",
    language: "ur",
    name: "Jalandhry",
    author: "Fateh Muhammad Jalandhry",
  },
  {
    slug: "urd-muhammadjunagar",
    id: "urd-junagarhi",
    language: "ur",
    name: "Junagarhi",
    author: "Muhammad Junagarhi",
  },
  {
    slug: "urd-ahmedali",
    id: "urd-ahmedali",
    language: "ur",
    name: "Ahmed Ali",
    author: "Ahmed Ali",
  },
  {
    slug: "urd-muhammadtahirul",
    id: "urd-tahirulqadri",
    language: "ur",
    name: "Irfan-ul-Quran",
    author: "Muhammad Tahir-ul-Qadri",
  },
  {
    slug: "ben-muhiuddinkhan",
    id: "ben-muhiuddinkhan",
    language: "bn",
    name: "Muhiuddin Khan",
    author: "Muhiuddin Khan",
  },
];

const RTL_LANGUAGES = new Set(["ar", "ur", "fa", "ps"]);
const direction = (language: string): "rtl" | "ltr" =>
  RTL_LANGUAGES.has(language) ? "rtl" : "ltr";

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

  await writeJson("surahs.json", {
    version: DATA_VERSION,
    source: "Tanzil quran-data.xml (https://tanzil.net)",
    surahs,
  });
  await writeJson("structure.json", {
    version: DATA_VERSION,
    source: "Tanzil quran-data.xml (https://tanzil.net)",
    totals: { surahs: TOTAL_SURAHS, ayahs: TOTAL_AYAHS, juz: juz.length, pages: pages.length },
    juz,
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

  // 3) Translations from fawazahmed0 editions (with provenance lookup).
  console.log("• Translations");
  const editions = await getJson<Record<string, EditionMeta>>(`${FAWAZ_BASE}/editions.json`);
  const manifest: Record<string, unknown> = {};

  for (const t of TRANSLATIONS) {
    const meta = Object.values(editions).find((e) => e.name === t.slug);
    const data = await getJson<{ quran: { chapter: number; verse: number; text: string }[] }>(
      `${FAWAZ_BASE}/editions/${t.slug}.json`,
    );
    if (data.quran.length !== TOTAL_AYAHS) {
      throw new Error(`${t.slug}: expected ${TOTAL_AYAHS} verses, got ${data.quran.length}`);
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
      direction: direction(t.language),
      sourceSlug: t.slug,
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

  console.log(
    `\nDone. ${surahs.length} surahs, ${arabicVerses.length} ayahs, ${TRANSLATIONS.length} translations.`,
  );
}

main().catch((err: unknown) => {
  console.error("\nIngestion failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
