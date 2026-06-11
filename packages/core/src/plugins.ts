/**
 * Content plugin system — the extensibility milestone.
 *
 * A *content plugin* is a small, declarative manifest describing a piece of
 * content (a translation, a tafsir, a reciter). Adding content means adding a
 * manifest — no changes to the core or app code. This file defines the contract
 * (the "published port") and a pure registry; pure logic only, zero deps.
 *
 * Delivery differs by kind: translations are ingested into the datasets at build
 * time, while tafsir text and reciter audio are fetched at runtime from a URL
 * template. The template understands `{surah}` / `{ayah}` and zero-padded forms
 * like `{surah:3}` (e.g. EveryAyah's `001001.mp3`).
 */
import type { TextDirection, VerseKey } from "./entities";

export type PluginKind = "translation" | "tafsir" | "reciter" | "hadith";

interface PluginBase {
  id: string;
  name: string;
  /** ISO-639 language code. */
  language: string;
  /** Defaults to true when omitted. */
  enabled?: boolean;
}

/** A translation edition, ingested into the datasets from a source. */
export interface TranslationPlugin extends PluginBase {
  kind: "translation";
  author: string;
  direction: TextDirection;
  /** Source edition slug (currently the fawazahmed0/quran-api id). */
  source: string;
}

/** A tafsir edition, fetched per-surah at runtime from `surahUrlTemplate`. */
export interface TafsirPlugin extends PluginBase {
  kind: "tafsir";
  author: string;
  direction: TextDirection;
  /** URL with `{surah}`; returns that surah's tafsir entries. */
  surahUrlTemplate: string;
}

/** A reciter, whose per-ayah audio lives at `audioUrlTemplate`. */
export interface ReciterPlugin extends PluginBase {
  kind: "reciter";
  style?: string;
  /** URL with `{surah}` / `{ayah}` (often `{surah:3}{ayah:3}`). */
  audioUrlTemplate: string;
  /**
   * quran.com recitation id, when this reciter has word-by-word timing there.
   * Enables word highlighting (audio + segments are fetched from quran.com).
   */
  quranComId?: number;
}

/** A hadith collection edition, fetched per-section at runtime. */
export interface HadithPlugin extends PluginBase {
  kind: "hadith";
  direction: TextDirection;
  /** Collection slug used in URLs (e.g. "eng-bukhari"). */
  collection: string;
  /** URL with `{section}`; returns that section's hadiths. */
  sectionUrlTemplate: string;
}

export type ContentPlugin = TranslationPlugin | TafsirPlugin | ReciterPlugin | HadithPlugin;

const pad = (value: number, width: number): string => String(value).padStart(width, "0");

/** Fill `{name}` / `{name:N}` placeholders from a variable map. */
export function fillTemplate(template: string, vars: Record<string, number>): string {
  return template.replace(/\{(\w+)(?::(\d+))?\}/g, (match, field: string, width?: string) => {
    const value = vars[field];
    if (value === undefined) return match;
    return width ? pad(value, Number(width)) : String(value);
  });
}

/** Fill `{surah}` / `{ayah}` (optionally `{surah:N}`) placeholders. */
export function fillVerseTemplate(template: string, ref: VerseKey): string {
  return fillTemplate(template, { surah: ref.sura, ayah: ref.aya });
}

/** The audio URL for one ayah of a reciter. */
export function reciterAudioUrl(reciter: ReciterPlugin, ref: VerseKey): string {
  return fillVerseTemplate(reciter.audioUrlTemplate, ref);
}

/** quran.com's word-timing audio CDN — the base for resolving timing paths. */
const QURAN_COM_AUDIO_BASE = "https://verses.quran.com/";

/**
 * Resolve a quran.com per-verse timing-audio reference to an absolute URL. The
 * API returns a relative path (`"Alafasy/mp3/001001.mp3"`), a protocol-relative
 * URL (`"//mirrors…/001001.mp3"`, as Husary does), or an already-absolute URL —
 * all three resolve correctly against the CDN base.
 */
export function quranComAudioUrl(path: string): string {
  return new URL(path, QURAN_COM_AUDIO_BASE).href;
}

/** The URL for a surah's tafsir (only `{surah}` is used). */
export function tafsirSurahUrl(tafsir: TafsirPlugin, surah: number): string {
  return fillTemplate(tafsir.surahUrlTemplate, { surah });
}

/** The URL for a hadith collection's section. */
export function hadithSectionUrl(hadith: HadithPlugin, section: number): string {
  return fillTemplate(hadith.sectionUrlTemplate, { section });
}

/** Validate a plugin manifest, returning a list of problems (empty = valid). */
export function validatePlugin(plugin: ContentPlugin): string[] {
  const errors: string[] = [];
  if (!plugin.id) errors.push("missing id");
  if (!plugin.name) errors.push("missing name");
  if (!plugin.language) errors.push("missing language");
  if (plugin.kind === "translation" && !plugin.source) errors.push("translation: missing source");
  if (plugin.kind === "tafsir" && !plugin.surahUrlTemplate.includes("{surah}")) {
    errors.push("tafsir: surahUrlTemplate must contain {surah}");
  }
  if (plugin.kind === "reciter" && !/\{surah/.test(plugin.audioUrlTemplate)) {
    errors.push("reciter: audioUrlTemplate must contain {surah}");
  }
  if (plugin.kind === "hadith" && !plugin.sectionUrlTemplate.includes("{section}")) {
    errors.push("hadith: sectionUrlTemplate must contain {section}");
  }
  return errors;
}

/** A pure, in-memory registry of content plugins, keyed by id. */
export class PluginRegistry {
  readonly #byId = new Map<string, ContentPlugin>();

  constructor(plugins: Iterable<ContentPlugin> = []) {
    for (const plugin of plugins) this.register(plugin);
  }

  register(plugin: ContentPlugin): this {
    this.#byId.set(plugin.id, plugin);
    return this;
  }

  get(id: string): ContentPlugin | undefined {
    return this.#byId.get(id);
  }

  /** Enabled plugins of a kind, narrowed to the matching type. */
  byKind<K extends PluginKind>(kind: K): Extract<ContentPlugin, { kind: K }>[] {
    return [...this.#byId.values()].filter(
      (p): p is Extract<ContentPlugin, { kind: K }> => p.kind === kind && p.enabled !== false,
    );
  }

  all(): ContentPlugin[] {
    return [...this.#byId.values()];
  }
}
