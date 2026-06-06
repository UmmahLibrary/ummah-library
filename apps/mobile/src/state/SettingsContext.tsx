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
import { KEYS, getJSON, getString, setJSON, setString } from "../storage";
import { RECITER, TAFSIRS } from "../plugins";
import { DEFAULT_EDITIONS, MAX_SCALE, MIN_SCALE, type ReadingMode } from "../types";

interface SettingsValue {
  editions: string[];
  readingMode: ReadingMode;
  readingTranslation: string | null;
  reciterId: string;
  tafsirId: string;
  scale: number;
  catalogue: Translation[];
  tafsirs: TafsirMeta[];
  setEditions: (ids: string[]) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setReadingTranslation: (id: string) => void;
  setReciterId: (id: string) => void;
  setTafsirId: (id: string) => void;
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
  const [scale, setScaleState] = useState<number>(1);
  const [catalogue, setCatalogue] = useState<Translation[]>([]);
  const [tafsirs, setTafsirs] = useState<TafsirMeta[]>([]);

  useEffect(() => {
    void (async () => {
      const [ed, mode, rtr, reciter, tafsir, sc] = await Promise.all([
        getJSON<string[]>(KEYS.editions, DEFAULT_EDITIONS),
        getString(KEYS.readingMode),
        getString(KEYS.readingTranslation),
        getString(KEYS.reciter),
        getString(KEYS.tafsir),
        getJSON<number>(KEYS.scale, 1),
      ]);
      setEditionsState(ed.length > 0 ? ed : DEFAULT_EDITIONS);
      if (mode === "translation" || mode === "reading" || mode === "reading-tr")
        setReadingModeState(mode);
      if (rtr) setReadingTranslationState(rtr);
      if (reciter) setReciterIdState(reciter);
      if (tafsir) setTafsirIdState(tafsir);
      setScaleState(clampScale(sc));
    })();
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
    void setJSON(KEYS.editions, next);
  }, []);

  const setReadingMode = useCallback((mode: ReadingMode) => {
    setReadingModeState(mode);
    void setString(KEYS.readingMode, mode);
  }, []);

  const setReadingTranslation = useCallback((id: string) => {
    setReadingTranslationState(id);
    void setString(KEYS.readingTranslation, id);
  }, []);

  const setReciterId = useCallback((id: string) => {
    setReciterIdState(id);
    void setString(KEYS.reciter, id);
  }, []);

  const setTafsirId = useCallback((id: string) => {
    setTafsirIdState(id);
    void setString(KEYS.tafsir, id);
  }, []);

  const setScale = useCallback((next: number) => {
    const clamped = clampScale(next);
    setScaleState(clamped);
    void setJSON(KEYS.scale, clamped);
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({
      editions,
      readingMode,
      readingTranslation,
      reciterId,
      tafsirId,
      scale,
      catalogue,
      tafsirs,
      setEditions,
      setReadingMode,
      setReadingTranslation,
      setReciterId,
      setTafsirId,
      setScale,
    }),
    [
      editions,
      readingMode,
      readingTranslation,
      reciterId,
      tafsirId,
      scale,
      catalogue,
      tafsirs,
      setEditions,
      setReadingMode,
      setReadingTranslation,
      setReciterId,
      setTafsirId,
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
