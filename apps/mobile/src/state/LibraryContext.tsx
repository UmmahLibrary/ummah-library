/**
 * The reader's personal library: surah bookmarks, the last-read surah, and Hifz
 * (memorization) cards. All local-first (ADR 0006), persisted to `ul.bookmarks`,
 * `ul.lastRead`, and `ul.hifz`. SM-2 scheduling itself is the pure `core` engine;
 * this context just stores cards and exposes due/all queries reactively.
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
import {
  type Collection,
  type HifzActivityLog,
  type HifzCard,
  type VerseKey,
  compareVerseKeys,
  isDue,
  logReview,
} from "@ummahlibrary/core";
import { KEYS, getJSON, isObjectRecord, setJSON } from "../storage";
import { mobileLibraryStore as library } from "./library-store";
import { onSyncApplied } from "../lib/sync/sync-events";
import { EMPTY_STREAK, advanceStreak, type StreakData } from "../hifz";

export interface HifzRecord {
  ref: VerseKey;
  card: HifzCard;
}

type HifzStore = Record<string, HifzCard>;
const keyOf = (ref: VerseKey): string => `${ref.sura}:${ref.aya}`;
const parseKey = (key: string): VerseKey => {
  const [sura, aya] = key.split(":").map(Number);
  return { sura: sura!, aya: aya! };
};

interface LibraryValue {
  /** False until the initial AsyncStorage load completes. */
  ready: boolean;
  bookmarks: number[];
  lastRead: number | null;
  isBookmarked: (surah: number) => boolean;
  toggleBookmark: (surah: number) => void;
  setLastRead: (surah: number) => void;
  isTracked: (ref: VerseKey) => boolean;
  getCard: (ref: VerseKey) => HifzCard | null;
  setHifzCard: (ref: VerseKey, card: HifzCard) => void;
  removeHifzCard: (ref: VerseKey) => void;
  allRecords: () => HifzRecord[];
  dueRecords: (now: Date) => HifzRecord[];
  trackedCount: number;
  /** Daily review streak. `touchStreak` records a review completed today. */
  streak: StreakData;
  touchStreak: () => void;
  /** Per-day review-activity log (heatmap source). `recordReview` counts one review today. */
  reviewLog: HifzActivityLog;
  recordReview: () => void;
  /** Ayah-level bookmark collections + per-ayah notes (separate from `bookmarks`). */
  collections: Collection[];
  notes: Record<string, string>;
  updateCollections: (next: Collection[]) => void;
  setNote: (ref: VerseKey, text: string) => void;
}

/** Stable id for a new collection. */
export function newCollectionId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const LibraryContext = createContext<LibraryValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [lastRead, setLastReadState] = useState<number | null>(null);
  const [hifz, setHifz] = useState<HifzStore>({});
  const [streak, setStreak] = useState<StreakData>(EMPTY_STREAK);
  const [reviewLog, setReviewLog] = useState<HifzActivityLog>({});
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const [bm, lr, hz, st, log, cols, nts] = await Promise.all([
      library.readBookmarks(),
      getJSON<{ surah: number } | null>(KEYS.lastRead, null, isObjectRecord),
      getJSON<HifzStore>(KEYS.hifz, {}, isObjectRecord),
      getJSON<StreakData>(
        KEYS.hifzStreak,
        EMPTY_STREAK,
        (v) =>
          isObjectRecord(v) &&
          typeof (v as StreakData).count === "number" &&
          typeof (v as StreakData).lastDate === "string",
      ),
      getJSON<HifzActivityLog>(KEYS.hifzReviewLog, {}, isObjectRecord),
      library.readCollections(),
      library.readNotes(),
    ]);
    setBookmarks(bm);
    setLastReadState(lr?.surah ?? null);
    setHifz(hz);
    setStreak(st);
    setReviewLog(log);
    setCollections(cols);
    setNotes(nts);
    setReady(true);
  }, []);

  // Load on mount, and re-hydrate when a sync round pulls in remote changes.
  useEffect(() => {
    void load();
    return onSyncApplied(() => void load());
  }, [load]);

  const updateCollections = useCallback((next: Collection[]) => {
    setCollections(next);
    void library.writeCollections(next);
  }, []);

  const setNote = useCallback((ref: VerseKey, text: string) => {
    setNotes((prev) => {
      const key = `${ref.sura}:${ref.aya}`;
      const next = { ...prev };
      if (text.trim()) next[key] = text;
      else delete next[key];
      void library.writeNotes(next);
      return next;
    });
  }, []);

  const touchStreak = useCallback(() => {
    setStreak((prev) => {
      const next = advanceStreak(prev, new Date());
      if (next !== prev) void setJSON(KEYS.hifzStreak, next);
      return next;
    });
  }, []);

  const recordReview = useCallback(() => {
    setReviewLog((prev) => {
      const next = logReview(prev, new Date());
      void setJSON(KEYS.hifzReviewLog, next);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((surah: number) => {
    setBookmarks((prev) => {
      const next = prev.includes(surah) ? prev.filter((n) => n !== surah) : [...prev, surah];
      void library.writeBookmarks(next);
      return next;
    });
  }, []);

  const setLastRead = useCallback((surah: number) => {
    setLastReadState(surah);
    void setJSON(KEYS.lastRead, { surah });
  }, []);

  const setHifzCard = useCallback((ref: VerseKey, card: HifzCard) => {
    setHifz((prev) => {
      const next = { ...prev, [keyOf(ref)]: card };
      void setJSON(KEYS.hifz, next);
      return next;
    });
  }, []);

  const removeHifzCard = useCallback((ref: VerseKey) => {
    setHifz((prev) => {
      const next = { ...prev };
      delete next[keyOf(ref)];
      void setJSON(KEYS.hifz, next);
      return next;
    });
  }, []);

  const allRecords = useCallback(
    (): HifzRecord[] =>
      Object.entries(hifz)
        .map(([key, card]) => ({ ref: parseKey(key), card }))
        .sort((a, b) => compareVerseKeys(a.ref, b.ref)),
    [hifz],
  );

  const value = useMemo<LibraryValue>(
    () => ({
      ready,
      bookmarks,
      lastRead,
      isBookmarked: (surah) => bookmarks.includes(surah),
      toggleBookmark,
      setLastRead,
      isTracked: (ref) => keyOf(ref) in hifz,
      getCard: (ref) => hifz[keyOf(ref)] ?? null,
      setHifzCard,
      removeHifzCard,
      allRecords,
      dueRecords: (now) => allRecords().filter((r) => isDue(r.card, now)),
      trackedCount: Object.keys(hifz).length,
      streak,
      touchStreak,
      reviewLog,
      recordReview,
      collections,
      notes,
      updateCollections,
      setNote,
    }),
    [
      ready,
      bookmarks,
      lastRead,
      hifz,
      streak,
      reviewLog,
      recordReview,
      collections,
      notes,
      toggleBookmark,
      setLastRead,
      setHifzCard,
      removeHifzCard,
      allRecords,
      touchStreak,
      updateCollections,
      setNote,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
