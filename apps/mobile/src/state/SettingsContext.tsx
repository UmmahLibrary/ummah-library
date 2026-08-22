/**
 * Reader settings: the selected translation editions, reading mode, the single
 * "Reading → Translations" choice, reciter, and font scale — all persisted to
 * the shared `ul.*` keys. Also loads the translation catalogue from `/editions`
 * so the manager can group and search it (pure logic lives in `core`).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { QuranScript, Translation } from "@ummahlibrary/core";
import { api, type TafsirMeta } from "../api";
import { mobileSettingsStore as store } from "./settings-store";
import { readTafsirCompare, writeTafsirCompare } from "../tafsir-compare-store";
import { onSyncApplied } from "../lib/sync/sync-events";
import { RECITER, TAFSIRS } from "../plugins";
import { defaultEditions, MAX_SCALE, MIN_SCALE, type ReadingMode } from "../types";

interface SettingsValue {
  editions: string[];
  readingMode: ReadingMode;
  readingTranslation: string | null;
  reciterId: string;
  tafsirId: string;
  /** Editions shown side by side in the per-āyah tafsir panel (#141); [] = just tafsirId. */
  tafsirCompare: string[];
  scale: number;
  /** Show the per-āyah Latin transliteration line under the Arabic (#150). */
  transliteration: boolean;
  /** Show per-word Latin transliteration beneath each Arabic word (#144). */
  wordTransliteration: boolean;
  /** Tap an Arabic word to hear just that word recited (#145). */
  tapToHear: boolean;
  /** Arabic script: "uthmani" (default) or "indopak" (ADR 0035). */
  script: QuranScript;
  catalogue: Translation[];
  tafsirs: TafsirMeta[];
  setEditions: (ids: string[]) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setReadingTranslation: (id: string) => void;
  setReciterId: (id: string) => void;
  setTafsirId: (id: string) => void;
  setTafsirCompare: (ids: string[]) => void;
  setScale: (scale: number | ((prev: number) => number)) => void;
  setTransliteration: (on: boolean) => void;
  setWordTransliteration: (on: boolean) => void;
  setTapToHear: (on: boolean) => void;
  setScript: (script: QuranScript) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

const clampScale = (n: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [editions, setEditionsState] = useState<string[]>(defaultEditions);
  const [readingMode, setReadingModeState] = useState<ReadingMode>("translation");
  const [readingTranslation, setReadingTranslationState] = useState<string | null>(null);
  const [reciterId, setReciterIdState] = useState<string>(RECITER.id);
  const [tafsirId, setTafsirIdState] = useState<string>(TAFSIRS[0].id);
  const [tafsirCompare, setTafsirCompareState] = useState<string[]>([]);
  const [scale, setScaleState] = useState<number>(1);
  const [transliteration, setTransliterationState] = useState<boolean>(false);
  const [wordTransliteration, setWordTransliterationState] = useState<boolean>(false);
  const [tapToHear, setTapToHearState] = useState<boolean>(false);
  const [script, setScriptState] = useState<QuranScript>("uthmani");
  const [catalogue, setCatalogue] = useState<Translation[]>([]);
  const [tafsirs, setTafsirs] = useState<TafsirMeta[]>([]);

  const loadPrefs = useCallback(async () => {
    const s = await store.read();
    if (s.editions && s.editions.length > 0) setEditionsState(s.editions);
    if (s.readingMode === "translation" || s.readingMode === "reading" || s.readingMode === "reading-tr")
      setReadingModeState(s.readingMode);
    if (s.readingTranslation) setReadingTranslationState(s.readingTranslation);
    if (s.reciter) setReciterIdState(s.reciter);
    if (s.tafsir) setTafsirIdState(s.tafsir);
    if (s.scale != null) setScaleState(clampScale(s.scale));
    if (s.transliteration != null) setTransliterationState(s.transliteration);
    if (s.wordTransliteration != null) setWordTransliterationState(s.wordTransliteration);
    if (s.tapToHear != null) setTapToHearState(s.tapToHear);
    if (s.script === "uthmani" || s.script === "indopak") setScriptState(s.script);
  }, []);

  useEffect(() => {
    void loadPrefs();
    void readTafsirCompare().then(setTafsirCompareState);
    void api
      .listTranslationCatalog()
      .then(setCatalogue)
      .catch(() => setCatalogue([]));
    void api
      .listTafsirs()
      .then(setTafsirs)
      .catch(() => setTafsirs([]));
    // Re-read prefs when a sync round pulls in a remote change (the catalogue is static).
    return onSyncApplied(() => void loadPrefs());
  }, [loadPrefs]);

  const setEditions = useCallback((ids: string[]) => {
    const next = ids.length > 0 ? ids : defaultEditions();
    setEditionsState(next);
    void store.writeEditions(next);
  }, []);

  const setReadingMode = useCallback((mode: ReadingMode) => {
    setReadingModeState(mode);
    void store.writeReadingMode(mode);
  }, []);

  const setReadingTranslation = useCallback((id: string) => {
    setReadingTranslationState(id);
    void store.writeReadingTranslation(id);
  }, []);

  const setReciterId = useCallback((id: string) => {
    setReciterIdState(id);
    void store.writeReciter(id);
  }, []);

  const setTafsirId = useCallback((id: string) => {
    setTafsirIdState(id);
    void store.writeTafsir(id);
  }, []);

  const setTafsirCompare = useCallback((ids: string[]) => {
    setTafsirCompareState(ids);
    void writeTafsirCompare(ids);
  }, []);

  // Accepts an updater function (like setState) so rapid taps on the A-/A+
  // stepper each apply on top of the latest value instead of racing on a
  // stale `scale` closure — see the identical fix for TasbihScreen's dial.
  const setScale = useCallback((next: number | ((prev: number) => number)) => {
    setScaleState((prev) => {
      const clamped = clampScale(typeof next === "function" ? next(prev) : next);
      void store.writeScale(clamped);
      return clamped;
    });
  }, []);

  const setTransliteration = useCallback((on: boolean) => {
    setTransliterationState(on);
    void store.writeTransliteration(on);
  }, []);

  const setWordTransliteration = useCallback((on: boolean) => {
    setWordTransliterationState(on);
    void store.writeWordTransliteration(on);
  }, []);

  const setTapToHear = useCallback((on: boolean) => {
    setTapToHearState(on);
    void store.writeTapToHear(on);
  }, []);

  const setScript = useCallback((next: QuranScript) => {
    setScriptState(next);
    void store.writeScript(next);
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({
      editions,
      readingMode,
      readingTranslation,
      reciterId,
      tafsirId,
      tafsirCompare,
      scale,
      transliteration,
      wordTransliteration,
      tapToHear,
      script,
      catalogue,
      tafsirs,
      setEditions,
      setReadingMode,
      setReadingTranslation,
      setReciterId,
      setTafsirId,
      setTafsirCompare,
      setScale,
      setTransliteration,
      setWordTransliteration,
      setTapToHear,
      setScript,
    }),
    [
      editions,
      readingMode,
      readingTranslation,
      reciterId,
      tafsirId,
      tafsirCompare,
      scale,
      transliteration,
      wordTransliteration,
      tapToHear,
      script,
      catalogue,
      tafsirs,
      setEditions,
      setReadingMode,
      setReadingTranslation,
      setReciterId,
      setTafsirId,
      setTafsirCompare,
      setScale,
      setTransliteration,
      setWordTransliteration,
      setTapToHear,
      setScript,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
