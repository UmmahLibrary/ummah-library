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
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
  HadithPlugin,
  TranslationPlugin,
} from "@ummahlibrary/core";
import { hadithCollectionUrl, validatePlugin } from "@ummahlibrary/core";

const DATA_VERSION = "1.0.0";
const TOTAL_SURAHS = 114;
const TOTAL_AYAHS = 6236;

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "datasets");
const PLUGINS_DIR = join(HERE, "..", "plugins");

const TANZIL_UTHMANI =
  "https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt&agree=true";
const TANZIL_METADATA = "https://tanzil.net/res/text/metadata/quran-data.xml";
// NOTE: the IndoPak Arabic text is intentionally NOT ingested/bundled (ADR 0035
// amendment) — its source forbids redistribution, so the web reader fetches it
// live from quran.com for display only. See ATTRIBUTION.md.
const FAWAZ_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";
// Morning & evening adhkar from Ḥiṣn al-Muslim, MIT-licensed and pre-structured
// (Arabic + translation + transliteration + graded source). See ADR 0016.
const ADHKAR_SRC =
  "https://cdn.jsdelivr.net/gh/Seen-Arabic/Morning-And-Evening-Adhkar-DB@main/en.json";
// The rest of the Ḥiṣn al-Muslim sets (#36) — after-salah dhikr and the daily
// occasion duas (waking, sleep, home, travel, eating, dressing, distress, …) —
// from fitrahive/dua-dhikr, MIT-licensed and in the same Arabic + transliteration
// ("latin") + translation + notes/benefits/source shape. See ATTRIBUTION.md.
const ADHKAR_AFTER_SALAH_SRC =
  "https://cdn.jsdelivr.net/gh/fitrahive/dua-dhikr@main/data/dua-dhikr/dhikr-after-salah/en.json";
const ADHKAR_DAILY_SRC =
  "https://cdn.jsdelivr.net/gh/fitrahive/dua-dhikr@main/data/dua-dhikr/daily-dua/en.json";
// The 99 Names of Allah — Arabic from the Quran/Sunnah with transliteration +
// English meaning, from the Apache-2.0 muslim-data project (verified licence).
// See ATTRIBUTION.md. The data ships inside a SQLite asset.
const ASMA_DB =
  "https://raw.githubusercontent.com/my-prayers/muslim-data-flutter/main/assets/db/muslim_db_v2.7.0.db";
// Word-by-word recitation timings (ADR 0036) from the quran-align dataset
// (CC-BY-4.0, https://github.com/cpfair/quran-align). It ships only as a release
// zip, so we download + unzip it and keep the per-reciter files whose audio we
// serve (matched by reciter *performance*). quran-align splits words exactly as
// Tanzil's quran-uthmani.txt does, so its word indices line up 1:1 with our
// Uthmani text and the reader's `data-w` spans.
const QURAN_ALIGN_ZIP =
  "https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip";
/** Our reciter id → the quran-align file (no extension) whose timings to use. */
const QURAN_ALIGN_FILES: Record<string, string> = {
  abdulbasit: "Abdul_Basit_Murattal_64kbps",
  alafasy: "Alafasy_128kbps",
  husary: "Husary_64kbps",
  minshawi: "Minshawy_Murattal_128kbps",
  shatri: "Abu_Bakr_Ash-Shaatree_128kbps",
  shuraym: "Saood_ash-Shuraym_128kbps",
  sudais: "Abdurrahmaan_As-Sudais_192kbps",
};
// Pinned after the first ingest; the timing step fails loudly if quran-align's
// data drifts from this hash, so a re-ingest is always deliberate and reviewed.
const TIMINGS_SHA256 = "9133dca74bf889f9c91561dfe467ea49f22786f3b6e19495c8112d33f046286d";

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

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
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

/** The fawazahmed0 hadith-api full-edition shape. */
interface FawazFullEdition {
  metadata: { name: string; sections: Record<string, string> };
  hadiths: {
    hadithnumber: number;
    text: string;
    grades?: ({ name: string; grade: string } | string)[];
    reference: { book: number; hadith: number };
  }[];
}

/**
 * Ingest the hadith collections at build time (ADR 0022). Each plugin's full
 * English edition is downloaded once and joined by `hadithnumber` with the
 * matching Arabic edition (fawazahmed0 mirrors every `eng-*` collection as
 * `ara-*` with identical numbering, #52), normalized to our `Hadith` shape
 * (keeping every grader's grade), and written to `datasets/hadiths/{id}.json`
 * with source attribution. Returns the per-collection hadith counts.
 */
async function ingestHadith(): Promise<number> {
  const plugins = readPlugins("hadiths").filter((p): p is HadithPlugin => p.kind === "hadith");
  console.log(`• Hadith (${plugins.length} collections, English + Arabic)`);
  let total = 0;
  for (const plugin of plugins) {
    const url = hadithCollectionUrl(plugin);
    // The Arabic edition mirrors the English one (eng-bukhari → ara-bukhari).
    const arabicUrl = url.replace("/eng-", "/ara-");
    const [data, arabicData] = await Promise.all([
      getJson<FawazFullEdition>(url),
      getJson<FawazFullEdition>(arabicUrl).catch(() => null),
    ]);

    const arabicByNumber = new Map<number, string>();
    for (const h of arabicData?.hadiths ?? []) {
      if (h.text && h.text.trim()) arabicByNumber.set(h.hadithnumber, h.text.trim());
    }

    const hadiths = data.hadiths
      .filter((h) => h.text && h.text.trim()) // drop empty/placeholder entries in the source
      .map((h) => {
        const arabic = arabicByNumber.get(h.hadithnumber);
        return {
          collectionId: plugin.id,
          number: h.hadithnumber,
          text: h.text.trim(),
          ...(arabic ? { arabic } : {}),
          grades: (h.grades ?? []).map((g) => (typeof g === "string" ? g : `${g.name}: ${g.grade}`)),
          reference: h.reference,
        };
      });
    if (hadiths.length < 40) {
      throw new Error(`Hadith ingest for ${plugin.id} looks wrong: ${hadiths.length} hadiths`);
    }

    const withArabic = hadiths.filter((h) => "arabic" in h).length;
    const coverage = Math.round((withArabic / hadiths.length) * 100);
    console.log(`  ${plugin.id}: ${hadiths.length} hadith · ${coverage}% Arabic`);
    if (!arabicData) {
      console.warn(`  ⚠ ${plugin.id}: Arabic edition unavailable (${arabicUrl}) — shipping English only`);
    } else if (coverage < 80) {
      // A present-but-misaligned Arabic edition would silently mis-pair text.
      throw new Error(`Arabic coverage for ${plugin.id} unexpectedly low: ${coverage}%`);
    }

    await writeJson(`hadiths/${plugin.id}.json`, {
      version: DATA_VERSION,
      collectionId: plugin.id,
      name: plugin.name,
      sections: data.metadata.sections ?? {},
      source: {
        url,
        ...(arabicData ? { arabicUrl } : {}),
        project: "fawazahmed0/hadith-api",
        retrieved: new Date().toISOString().slice(0, 10),
      },
      hadiths,
    });
    total += hadiths.length;
  }
  return total;
}

/** The dua-dhikr shape (`title`/`arabic`/`latin`/`translation`/`notes`/`source`,
 *  and either `benefits` or `fawaid` for the virtue) shared across its category
 *  files at https://github.com/fitrahive/dua-dhikr. */
interface DuaDhikrEntry {
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  notes: string | null;
  benefits?: string | null;
  fawaid?: string | null;
  source: string | null;
}

/** Parse a repeat count out of `notes` (e.g. "Read 3x", "Read 1x after Fajr"). */
function repeatOf(notes: string | null): number {
  const m = notes?.match(/(\d+)\s*x/i);
  return m ? Math.max(1, Number(m[1])) : 1;
}

/** `Dhikr` fields shared by every dua-dhikr entry, minus id/order/occasions. */
function fromDuaDhikr(it: DuaDhikrEntry): Omit<Dhikr, "id" | "order" | "occasions"> {
  const repeat = repeatOf(it.notes);
  const virtueText = (it.benefits ?? it.fawaid ?? "").trim();
  return {
    arabic: it.arabic.trim(),
    translation: it.translation.trim(),
    transliteration: it.latin.trim(),
    repeat,
    repeatLabel: repeat > 1 ? `${repeat}×` : "Once",
    // The source has no separate "name" field on `Dhikr` — lead the virtue text
    // with the dua's title so multi-item occasions (e.g. "distress", "daily")
    // stay identifiable in the UI's virtue/source disclosure.
    virtue: virtueText ? `${it.title} — ${virtueText}` : it.title,
    source: it.source?.trim() || undefined,
  };
}

/**
 * Classify a "daily-dua" entry into a Ḥiṣn al-Muslim occasion by its title
 * (stable, descriptive strings from the source — see fitrahive/dua-dhikr's
 * `data/dua-dhikr/daily-dua/en.json`). Anything not matched falls into "daily"
 * — a catch-all for the source's remaining daily-occasion duas
 * (entering/leaving the mosque, wuḍūʾ, rain, wind, sneezing, etc.) rather than
 * being dropped.
 */
function occasionsForDailyDua(title: string): AdhkarOccasion[] {
  const t = title.toLowerCase();
  if (t.includes("sleep")) return ["sleep"];
  if (t.includes("waking")) return ["waking"];
  if (t.includes("house")) return ["home"];
  if (t.includes("travel") || t.includes("mounting a vehicle")) return ["travel"];
  if (t.includes("eating") || t.includes("bismillah") || t.includes("breaking the fast")) {
    return ["eating"];
  }
  if (t.includes("clothes")) return ["dressing"];
  if (
    t.includes("calamity") ||
    t.includes("debt") ||
    t.includes("laziness") ||
    t.includes("seeking forgiveness") ||
    t.includes("ease in all matters")
  ) {
    return ["distress"];
  }
  return ["daily"];
}

/**
 * Ingest the adhkar collection — bundled content, small enough to ship.
 * Morning/evening comes from the original ADR 0016 source; the rest of the
 * Ḥiṣn al-Muslim sets (after-salah, waking, sleep, home, travel, eating,
 * dressing, distress, and a "daily" catch-all for the source's remaining
 * daily-occasion duas) were added by growing this step — see #36. No
 * architecture change: same `Dhikr` shape, same `AdhkarRepository`, same
 * bundled `adhkar.json`. Returns the total item count for the summary.
 */
async function ingestAdhkar(): Promise<number> {
  console.log("• Adhkar (Ḥiṣn al-Muslim)");
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
  const morningEvening: Dhikr[] = seen.map((it, i) => {
    const repeat = Number.isFinite(it.count) && it.count > 0 ? Math.floor(it.count) : 1;
    return {
      id: `me-${i + 1}`,
      order: 0, // reassigned below, once the full collection is assembled
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

  const AFTER_SALAH_OCCASIONS: AdhkarOccasion[] = ["after-salah"];
  console.log("  • after-salah (fitrahive/dua-dhikr, MIT)");
  const afterSalahRaw = await getJson<DuaDhikrEntry[]>(ADHKAR_AFTER_SALAH_SRC);
  const afterSalah: Dhikr[] = afterSalahRaw.map((it, i) => ({
    id: `as-${i + 1}`,
    order: 0,
    occasions: AFTER_SALAH_OCCASIONS,
    ...fromDuaDhikr(it),
  }));

  console.log(
    "  • daily duas — waking/sleep/home/travel/eating/dressing/distress/daily (fitrahive/dua-dhikr, MIT)",
  );
  const dailyRaw = await getJson<DuaDhikrEntry[]>(ADHKAR_DAILY_SRC);
  const daily: Dhikr[] = dailyRaw.map((it, i) => ({
    id: `dd-${i + 1}`,
    order: 0,
    occasions: occasionsForDailyDua(it.title),
    ...fromDuaDhikr(it),
  }));

  const adhkar: Dhikr[] = [...morningEvening, ...afterSalah, ...daily].map((d, i) => ({
    ...d,
    order: i + 1,
  }));
  if (adhkar.length < 80 || !adhkar.every((d) => d.arabic && d.translation && d.occasions.length)) {
    throw new Error(`Adhkar ingest looks wrong: ${adhkar.length} items`);
  }
  await writeJson("adhkar.json", {
    version: DATA_VERSION,
    sources: [
      "Seen-Arabic/Morning-And-Evening-Adhkar-DB (MIT) — morning & evening, derived from Ḥiṣn al-Muslim by Saʿīd al-Qaḥṭānī",
      "fitrahive/dua-dhikr (MIT) — after-salah and the other daily occasions, derived from Ḥiṣn al-Muslim by Saʿīd al-Qaḥṭānī",
    ],
    adhkar,
  });
  return adhkar.length;
}

/** A quran-align per-ayah entry; `segments` is non-array on alignment failures. */
interface QuranAlignEntry {
  surah: number;
  ayah: number;
  segments: unknown;
}

/**
 * Parse a quran-align reciter file. One file (As-Sudais) ships with a multi-line
 * "Crashed Command …" error dump prepended before the JSON array, which makes the
 * whole file invalid JSON. When a clean parse fails, retry from the first `[{` —
 * the start of the real array of entries (the garbage never contains that token).
 */
function parseAlign(raw: string): QuranAlignEntry[] {
  try {
    return JSON.parse(raw) as QuranAlignEntry[];
  } catch {
    const start = raw.indexOf("[{");
    if (start >= 0) return JSON.parse(raw.slice(start)) as QuranAlignEntry[];
    throw new Error("quran-align file is not parseable JSON");
  }
}

/**
 * Ingest word-by-word recitation timings (ADR 0036) from the quran-align release
 * (CC-BY-4.0). For each reciter we serve, the `[wordStart, wordEnd, startMs,
 * endMs]` ranges are expanded to one compact `[wordIndex, startMs, endMs]` per
 * word and written to `datasets/timings/{reciterId}/{surah}.json`. Ayahs whose
 * alignment failed (segments not a clean list of 4-number arrays — quran-align
 * emits an error string for those) are skipped; the reader falls back to a live
 * source or no highlighting there. A SHA-256 over the output guards drift.
 */
async function ingestTimings(): Promise<number> {
  const ids = Object.keys(QURAN_ALIGN_FILES).sort();
  console.log(`• Recitation timings — ${ids.length} reciters (quran-align, CC-BY-4.0)`);
  const tmp = join(tmpdir(), `ul-qa-${Date.now()}`);
  await mkdir(tmp, { recursive: true });
  const zipPath = join(tmp, "quran-align.zip");
  const res = await fetch(QURAN_ALIGN_ZIP);
  if (!res.ok) throw new Error(`GET ${QURAN_ALIGN_ZIP} -> ${res.status} ${res.statusText}`);
  await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
  try {
    execFileSync("unzip", ["-o", "-q", zipPath, "-d", tmp], { stdio: "ignore" });
  } catch {
    throw new Error("`unzip` is required to ingest timings — install it or extract the zip manually.");
  }

  let totalEntries = 0;
  const forHash: Record<string, [number, Record<number, [number, number, number][]>][]> = {};
  for (const id of ids) {
    const entries = parseAlign(readFileSync(join(tmp, `${QURAN_ALIGN_FILES[id]!}.json`), "utf8"));
    const bySurah = new Map<number, Record<number, [number, number, number][]>>();
    let skipped = 0;
    for (const e of entries) {
      const segs = e.segments;
      if (
        !Array.isArray(segs) ||
        segs.some((s) => !Array.isArray(s) || s.length !== 4 || s.some((n) => typeof n !== "number"))
      ) {
        skipped++;
        continue;
      }
      const words: [number, number, number][] = [];
      const seen = new Set<number>();
      for (const [start, end, startMs, endMs] of segs as number[][]) {
        for (let w = start!; w < end!; w++) {
          if (seen.has(w)) continue;
          seen.add(w);
          words.push([w, startMs!, endMs!]);
        }
      }
      if (!words.length) {
        skipped++;
        continue;
      }
      words.sort((a, b) => a[0] - b[0]);
      let ayahs = bySurah.get(e.surah);
      if (!ayahs) bySurah.set(e.surah, (ayahs = {}));
      ayahs[e.ayah] = words;
      totalEntries++;
    }
    const sorted = [...bySurah.entries()].sort((a, b) => a[0] - b[0]);
    for (const [surah, ayahs] of sorted) {
      const file = join(OUT, `timings/${id}/${surah}.json`);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify({ reciterId: id, surah, ayahs }), "utf8");
    }
    forHash[id] = sorted;
    const ayahCount = sorted.reduce((n, [, a]) => n + Object.keys(a).length, 0);
    console.log(`  ✓ ${id}: ${ayahCount} ayahs (${skipped} skipped)`);
  }

  const checksum = sha256(JSON.stringify(forHash));
  if (TIMINGS_SHA256 && checksum !== TIMINGS_SHA256) {
    throw new Error(
      `quran-align timing data changed (sha256 ${checksum} != pinned ${TIMINGS_SHA256}). ` +
        "Review the change; if intended, update TIMINGS_SHA256 in ingest.ts.",
    );
  }
  await writeJson("timings/index.json", {
    version: DATA_VERSION,
    source: "https://github.com/cpfair/quran-align (release 2016-11-24)",
    license: "CC-BY-4.0",
    attribution: "Word-by-word recitation timings: quran-align by Collin Fair (CC-BY-4.0)",
    checksum: `sha256:${checksum}`,
    reciters: ids,
  });
  if (!TIMINGS_SHA256) console.log(`  ℹ pin TIMINGS_SHA256 = "${checksum}"`);
  return totalEntries;
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

  // Fast path: ingest only the adhkar collection (ADR 0016, #36).
  if (process.argv.includes("--adhkar-only")) {
    const count = await ingestAdhkar();
    console.log(`\nIngested ${count} adhkar.\n`);
    return;
  }

  // Fast path: ingest only the hadith collections (ADR 0022).
  if (process.argv.includes("--hadith-only")) {
    const count = await ingestHadith();
    console.log(`\nIngested ${count} hadith across the collections.\n`);
    return;
  }

  // Fast path: ingest only the recitation timings (ADR 0036).
  if (process.argv.includes("--timings-only")) {
    const count = await ingestTimings();
    console.log(`\nIngested ${count} reciter-ayah timings.\n`);
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

  // 2b) Word-by-word recitation timings from quran-align (ADR 0036).
  const timingCount = await ingestTimings();

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

  // 5) Adhkar (ADR 0016, grown for #36 — see `ingestAdhkar`).
  const adhkarCount = await ingestAdhkar();

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

  // 7) Hadith collections — ingested from fawazahmed0/hadith-api (ADR 0022).
  const hadithCount = await ingestHadith();

  console.log(
    `\nDone. ${surahs.length} surahs, ${arabicVerses.length} ayahs (Uthmani), ${timingCount} reciter-ayah timings, ${translationPlugins.length} translations, ${adhkarCount} adhkar, ${names.length} names, ${hadithCount} hadith.`,
  );
}

main().catch((err: unknown) => {
  console.error("\nIngestion failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
