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
import type { Translation } from "@ummahlibrary/core";
import { api, type TafsirMeta } from "../api";
import { mobileSettingsStore as store } from "./settings-store";
import { readTafsirCompare, writeTafsirCompare } from "../tafsir-compare-store";
import { RECITER, TAFSIRS } from "../plugins";
import { DEFAULT_EDITIONS, MAX_SCALE, MIN_SCALE, type ReadingMode } from "../types";

interface SettingsValue {
  editions: string[];
  readingMode: ReadingMode;
  readingTranslation: string | null;
  reciterId: string;
  tafsirId: string;
  /** Editions shown side by side in the per-āyah tafsir panel (#141); [] = just tafsirId. */
  tafsirCompare: string[];
  scale: number;
  catalogue: Translation[];
  tafsirs: TafsirMeta[];
  setEditions: (ids: string[]) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setReadingTranslation: (id: string) => void;
  setReciterId: (id: string) => void;
  setTafsirId: (id: string) => void;
  setTafsirCompare: (ids: string[]) => void;
  setScale: (scale: number) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

const clampScale = (n: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [editions, setEditionsState] = useState<string[]>(DEFAULT_EDITIONS);
  const [readingMode, setReadingModeState] = useState<ReadingMode>("translation");
  const [readingTranslation, setReadingTranslationState] = useState<string | null>(null);
  const [reciterId, setReciterIdState] = useState<string>(RECITER.id);
  const [tafsirId, setTafsirIdState] = useState<string>(TAFSIRS[0].id);
  const [tafsirCompare, setTafsirCompareState] = useState<string[]>([]);
  const [scale, setScaleState] = useState<number>(1);
  const [catalogue, setCatalogue] = useState<Translation[]>([]);
  const [tafsirs, setTafsirs] = useState<TafsirMeta[]>([]);

  useEffect(() => {
    void store.read().then((s) => {
      if (s.editions && s.editions.length > 0) setEditionsState(s.editions);
      if (s.readingMode === "translation" || s.readingMode === "reading" || s.readingMode === "reading-tr")
        setReadingModeState(s.readingMode);
      if (s.readingTranslation) setReadingTranslationState(s.readingTranslation);
      if (s.reciter) setReciterIdState(s.reciter);
      if (s.tafsir) setTafsirIdState(s.tafsir);
      if (s.scale != null) setScaleState(clampScale(s.scale));
    });
    void readTafsirCompare().then(setTafsirCompareState);
    void api
      .listTranslationCatalog()
      .then(setCatalogue)
      .catch(() => setCatalogue([]));
    void api
      .listTafsirs()
      .then(setTafsirs)
      .catch(() => setTafsirs([]));
  }, []);

  const setEditions = useCallback((ids: string[]) => {
    const next = ids.length > 0 ? ids : DEFAULT_EDITIONS;
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

  const setScale = useCallback((next: number) => {
    const clamped = clampScale(next);
    setScaleState(clamped);
    void store.writeScale(clamped);
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
      catalogue,
      tafsirs,
      setEditions,
      setReadingMode,
      setReadingTranslation,
      setReciterId,
      setTafsirId,
      setTafsirCompare,
      setScale,
    }),
    [
      editions,
      readingMode,
      readingTranslation,
      reciterId,
      tafsirId,
      tafsirCompare,
      scale,
      catalogue,
      tafsirs,
      setEditions,
      setReadingMode,
      setReadingTranslation,
      setReciterId,
      setTafsirId,
      setTafsirCompare,
      setScale,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
