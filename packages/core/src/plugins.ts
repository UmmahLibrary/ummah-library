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

export type PluginKind = "translation" | "tafsir" | "reciter";

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
}

export type ContentPlugin = TranslationPlugin | TafsirPlugin | ReciterPlugin;

const pad = (value: number, width: number): string => String(value).padStart(width, "0");

/** Fill `{surah}` / `{ayah}` (optionally `{surah:N}`) placeholders. */
export function fillVerseTemplate(template: string, ref: VerseKey): string {
  return template.replace(
    /\{(surah|ayah)(?::(\d+))?\}/g,
    (_match, field: string, width?: string) => {
      const value = field === "surah" ? ref.sura : ref.aya;
      return width ? pad(value, Number(width)) : String(value);
    },
  );
}

/** The audio URL for one ayah of a reciter. */
export function reciterAudioUrl(reciter: ReciterPlugin, ref: VerseKey): string {
  return fillVerseTemplate(reciter.audioUrlTemplate, ref);
}

/** The URL for a surah's tafsir (only `{surah}` is used). */
export function tafsirSurahUrl(tafsir: TafsirPlugin, surah: number): string {
  return fillVerseTemplate(tafsir.surahUrlTemplate, { sura: surah, aya: 1 });
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
