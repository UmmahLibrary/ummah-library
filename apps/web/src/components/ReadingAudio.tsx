"use client";

import { useEffect, useRef, useState } from "react";
import {
  type PlayQueueItem,
  type ReciterPlugin,
  type TranslationAudioPlugin,
  type TranslationPlayMode,
  ayahCountOf,
  buildPlayQueue,
  cyclePlaybackRate,
  downloadSurahAudio,
  quranComAudioUrl,
  reciterAudioUrl,
  repeatRange,
} from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { readReciter, writeReciter } from "../lib/reader-prefs";
import {
  readLoop,
  readPlayMode,
  readRate,
  readTranslationVoice,
  writeLoop,
  writePlayMode,
  writeRate,
  writeTranslationVoice,
} from "../lib/reader-prefs-store";
import { type Segment, bundledSegments } from "../lib/audio-timing";
import { webAudioStore } from "../lib/audio-store";

const RECITER_KEY = "ul.reciter";

/** Repeat-count choices for an A→B range loop (∞ repeats until stopped). */
const REPEAT_COUNTS: { label: string; value: number }[] = [
  { label: "∞", value: Infinity },
  { label: "2×", value: 2 },
  { label: "3×", value: 3 },
  { label: "5×", value: 5 },
  { label: "10×", value: 10 },
];
const rateLabel = (rate: number): string => `${rate}×`;

interface Verse {
  sura: number;
  aya: number;
}
const keyOf = (v: Verse): string => `${v.sura}:${v.aya}`;
const parseKey = (key: string): Verse => {
  const [sura, aya] = key.split(":").map(Number);
  return { sura: sura!, aya: aya! };
};

interface Timing {
  url: string;
  segments: Segment[];
}

const timingCache = new Map<string, Promise<Timing | null>>();
/** Live word timings from the quran.com API — the fallback for reciters/ayahs that
 *  aren't in the bundled quran-align set (ADR 0036). */
function fetchTiming(recitationId: number, verseKey: string): Promise<Timing | null> {
  const cacheKey = `${recitationId}:${verseKey}`;
  let pending = timingCache.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetch(
          `https://api.quran.com/api/v4/verses/by_key/${verseKey}?audio=${recitationId}`,
        );
        if (!res.ok) return null;
        const data = (await res.json()) as {
          verse?: { audio?: { url: string; segments: Segment[] } };
        };
        const audio = data.verse?.audio;
        return audio ? { url: quranComAudioUrl(audio.url), segments: audio.segments } : null;
      } catch {
        return null;
      }
    })();
    timingCache.set(cacheKey, pending);
  }
  return pending;
}

/**
 * Audio URL + word timings for one verse (ADR 0036). Prefers the bundled
 * quran-align timings (offline, no API): for those, the audio comes from the
 * reciter's own everyayah template via `reciterAudioUrl`. Falls back to the live
 * quran.com timing API for reciters/ayahs the bundle doesn't cover, then to plain
 * audio with no highlighting.
 */
async function getTiming(reciter: ReciterPlugin, verseKey: string): Promise<Timing> {
  const [sura, aya] = verseKey.split(":").map(Number) as [number, number];
  const bundled = await bundledSegments(reciter.id, sura, aya);
  if (bundled) return { url: reciterAudioUrl(reciter, { sura, aya }), segments: bundled };
  if (reciter.quranComId) {
    const live = await fetchTiming(reciter.quranComId, verseKey);
    if (live) return live;
  }
  return { url: reciterAudioUrl(reciter, { sura, aya }), segments: [] };
}

/**
 * Audio player for an ordered list of verses, which may span surahs (used by
 * both the surah reader and the juzʾ reader). Each ayah block must have
 * id="sura:aya"; play buttons use data-play-key (play from there) or
 * data-play-one (play just that ayah). Words highlight via quran.com timing.
 */
export function ReadingAudio({
  verses,
  reciters,
  translationVoices = [],
  variant = "inline",
  onAyah,
  startVerse,
}: {
  verses: Verse[];
  reciters: ReciterPlugin[];
  /** Translation-audio voices (#204) — spoken recitation of a translation's
   *  text, playable alongside or instead of the Arabic reciter. */
  translationVoices?: TranslationAudioPlugin[];
  /** "inline" = compact bar inside content (juzʾ); "dock" = fixed bottom player (surah reader). */
  variant?: "inline" | "dock";
  /** Called when an āyah starts playing — lets the reader advance its resume position. */
  onAyah?: (verse: Verse) => void;
  /** Where a fresh ▶ should begin (the reader's current āyah). Falls back to the
   *  first verse when it returns null. */
  startVerse?: () => Verse | null;
}) {
  const [reciterId, setReciterId] = useState(reciters[0]?.id ?? "");
  const [current, setCurrent] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [rate, setRate] = useState(1);
  // Translation-audio (#204): which voice, and how it plays alongside the
  // Arabic reciter. Off by default — selecting a mode is an explicit choice.
  const [translationVoiceId, setTranslationVoiceId] = useState(translationVoices[0]?.id ?? "");
  const [playMode, setPlayMode] = useState<TranslationPlayMode>("arabic-only");
  const playModeRef = useRef<TranslationPlayMode>("arabic-only");
  // A→B range-repeat UI state (the panel + the chosen bounds/count).
  const [showRange, setShowRange] = useState(false);
  const [rangeFrom, setRangeFrom] = useState<string | null>(null);
  const [rangeTo, setRangeTo] = useState<string | null>(null);
  const [repeatCount, setRepeatCount] = useState<number>(Infinity);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef(0);
  // Read live inside the playback `onended` closure, not a stale capture.
  const loopRef = useRef(false);
  const rateRef = useRef(1);
  // `repeatRef` holds the countdown while an A→B range loop is active
  // (Infinity = until stopped); null otherwise. The queue itself (the whole
  // list, an A→B slice, or a single tapped āyah — each possibly expanded to
  // interleave translation audio, #204) is passed explicitly through the
  // recursive `play()` calls below rather than held in a ref, so advancing
  // never has to re-derive "where am I" by re-searching the list.
  const repeatRef = useRef<{ remaining: number } | null>(null);
  const versesRef = useRef(verses);
  versesRef.current = verses;
  const wordRef = useRef<{ block: HTMLElement | null; segments: Segment[] | null; last: number }>({
    block: null,
    segments: null,
    last: -1,
  });
  // The live blob: object URL for a downloaded ayah, revoked before the next one.
  const objectUrlRef = useRef<string | null>(null);
  // Offline downloads (#202): in-flight progress + which of this list's surahs are saved.
  const [download, setDownload] = useState<{ done: number; total: number } | null>(null);
  const [savedSurahs, setSavedSurahs] = useState<Set<number>>(new Set());

  /** Set the audio source, revoking any previous blob URL so it can't leak. */
  function setAudioSrc(audio: HTMLAudioElement, src: string) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (src.startsWith("blob:")) objectUrlRef.current = src;
    audio.src = src;
  }

  /** The distinct surahs the current verse list spans (one for a surah, many for a juzʾ). */
  const listSurahs = Array.from(new Set(verses.map((v) => v.sura)));

  // Reflect which of this list's surahs are already downloaded for the reciter.
  useEffect(() => {
    let live = true;
    void webAudioStore.savedSurahs().then((saved) => {
      if (!live) return;
      const full = new Set(
        saved
          .filter((s) => s.reciterId === reciterId && s.ayahCount >= ayahCountOf(s.surah))
          .map((s) => s.surah),
      );
      setSavedSurahs(full);
    });
    return () => {
      live = false;
    };
  }, [reciterId, verses, download]);

  /** Download every surah in the current list for the selected reciter, with progress. */
  async function downloadAudio() {
    const reciter = reciters.find((r) => r.id === reciterId) ?? reciters[0];
    if (!reciter || download) return;
    const total = listSurahs.reduce((n, s) => n + ayahCountOf(s), 0);
    let done = 0;
    setDownload({ done: 0, total });
    try {
      for (const s of listSurahs) {
        await downloadSurahAudio(webAudioStore, reciter, s, {
          onProgress: () => setDownload({ done: ++done, total }),
        });
      }
    } finally {
      setDownload(null);
    }
  }

  useEffect(() => {
    void readReciter().then((saved) => {
      if (saved && reciters.some((r) => r.id === saved)) setReciterId(saved);
    });
    const savedLoop = readLoop();
    setLoop(savedLoop);
    loopRef.current = savedLoop;
    const savedRate = readRate();
    setRate(savedRate);
    rateRef.current = savedRate;
    const savedVoice = readTranslationVoice();
    if (savedVoice && translationVoices.some((v) => v.id === savedVoice)) {
      setTranslationVoiceId(savedVoice);
    }
    const savedPlayMode = readPlayMode();
    // A saved mode that needs a voice, but no voice is available on this
    // list/build, degrades to Arabic-only rather than silently playing nothing.
    if (savedPlayMode === "arabic-only" || translationVoices.length > 0) {
      setPlayMode(savedPlayMode);
      playModeRef.current = savedPlayMode;
    }

    // The reader toolbar can change the reciter; keep the dock in sync.
    const onReciter = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (reciters.some((r) => r.id === id)) {
        setReciterId(id);
        stop();
      }
    };
    window.addEventListener(RECITER_KEY, onReciter as EventListener);
    return () => window.removeEventListener(RECITER_KEY, onReciter as EventListener);
  }, [reciters]);

  function toggleLoop() {
    const next = !loopRef.current;
    loopRef.current = next;
    setLoop(next);
    writeLoop(next);
  }

  /** Cycle the playback speed, persist it, and apply it to the live audio at once. */
  function cycleRate() {
    const next = cyclePlaybackRate(rateRef.current);
    rateRef.current = next;
    setRate(next);
    writeRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  /** Cycle Arabic-only → Arabic+translation → translation-only (#204), off a
   *  no-op when there's no translation voice to cycle into. */
  function cyclePlayMode() {
    if (translationVoices.length === 0) return;
    const order: TranslationPlayMode[] = ["arabic-only", "interleaved", "translation-only"];
    const next = order[(order.indexOf(playModeRef.current) + 1) % order.length]!;
    playModeRef.current = next;
    setPlayMode(next);
    writePlayMode(next);
    stop();
  }

  /** Play the whole list from `start`, advancing ayah-to-ayah (no range loop). */
  function playAll(start: Verse) {
    repeatRef.current = null;
    const queue = buildPlayQueue(versesRef.current, playModeRef.current);
    const idx = queue.findIndex((q) => q.verse.sura === start.sura && q.verse.aya === start.aya);
    void play(queue, idx >= 0 ? idx : 0, "repeatOrLoop");
  }

  /** Loop the inclusive A→B range `count` times (Infinity = until stopped). */
  function playRange(from: string | null, to: string | null, count: number) {
    const slice = repeatRange(versesRef.current, from, to);
    const queue = buildPlayQueue(slice, playModeRef.current);
    if (queue.length === 0) return;
    repeatRef.current = { remaining: count };
    void play(queue, 0, "repeatOrLoop");
  }

  function clearWord() {
    document.querySelectorAll(".w--active").forEach((el) => el.classList.remove("w--active"));
    wordRef.current = { block: null, segments: null, last: -1 };
  }

  function highlightAyah(key: string | null) {
    document
      .querySelectorAll(".ayah--playing")
      .forEach((el) => el.classList.remove("ayah--playing"));
    if (key === null) return;
    const el = document.getElementById(key);
    el?.classList.add("ayah--playing");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function onTimeUpdate() {
    const state = wordRef.current;
    const audio = audioRef.current;
    if (!state.block || !state.segments || !audio) return;
    const ms = audio.currentTime * 1000;
    let index = -1;
    for (const seg of state.segments) {
      if (ms >= seg[2] && ms < seg[3]) {
        index = seg[0];
        break;
      }
    }
    if (index === state.last) return;
    state.last = index;
    state.block.querySelectorAll(".w--active").forEach((el) => el.classList.remove("w--active"));
    if (index >= 0) state.block.querySelector(`.w[data-w="${index}"]`)?.classList.add("w--active");
  }

  function stop() {
    repeatRef.current = null;
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrent(null);
    highlightAyah(null);
    clearWord();
  }

  /**
   * Play one queue item (an āyah's Arabic recitation or its translation-audio,
   * #204) and, on end, auto-advance to the next item in `queue`. `atEnd`
   * governs only what happens once the queue itself is exhausted: `"stop"` for
   * a single tapped āyah (never loops, even if the whole-surah loop toggle is
   * on — matches the pre-#204 `advance: false` behaviour exactly), or
   * `"repeatOrLoop"` to consult the A→B repeat countdown / loop toggle, same as
   * plain reciter playback always has.
   */
  async function play(
    queue: PlayQueueItem<Verse>[],
    idx: number,
    atEnd: "stop" | "repeatOrLoop",
  ) {
    const item = queue[idx];
    if (!item) return stop();
    const { verse, source } = item;
    const reciter = reciters.find((r) => r.id === reciterId) ?? reciters[0];
    const voice = translationVoices.find((v) => v.id === translationVoiceId);
    if ((source === "arabic" && !reciter) || (source === "translation" && !voice)) {
      stop();
      return;
    }
    const key = keyOf(verse);
    const token = ++tokenRef.current;
    const audio = (audioRef.current ??= new Audio());
    // Detach the previous āyah's handlers and pause it BEFORE any await: a
    // stale onended firing during the await below would advance past the
    // wrong item or decrement the new range's count. Neutralize it here,
    // before we yield.
    audio.onended = null;
    audio.ontimeupdate = null;
    audio.pause();
    clearWord();

    // Prefer a downloaded copy (offline #202 — reused as-is for translation
    // voices too, same AudioStore keyed by voice id) and touch no network.
    let src: string;
    let segments: Segment[] | null;
    if (source === "translation") {
      // No word-level timing for translation audio — plain per-ayah playback.
      const local = await webAudioStore.localUrl(voice!.id, verse);
      if (token !== tokenRef.current) {
        if (local) URL.revokeObjectURL(local);
        return;
      }
      src = local ?? reciterAudioUrl(voice!, verse);
      segments = null;
    } else {
      const local = await webAudioStore.localUrl(reciter!.id, verse);
      if (token !== tokenRef.current) {
        if (local) URL.revokeObjectURL(local);
        return;
      }
      if (local) {
        src = local;
        segments = await bundledSegments(reciter!.id, verse.sura, verse.aya);
      } else {
        const timing = await getTiming(reciter!, key);
        if (token !== tokenRef.current) return;
        src = timing.url;
        segments = timing.segments.length ? timing.segments : null;
      }
    }

    wordRef.current = { block: document.getElementById(key), segments, last: -1 };
    setAudioSrc(audio, src);
    audio.playbackRate = rateRef.current;
    audio.ontimeupdate = segments ? onTimeUpdate : null;
    const advanceOrEnd = () => {
      const nextIdx = idx + 1;
      if (nextIdx < queue.length) return void play(queue, nextIdx, atEnd);
      if (atEnd === "stop") return stop();
      // Reached the end of the queue.
      const rep = repeatRef.current;
      if (rep) {
        rep.remaining -= 1; // Infinity - 1 stays Infinity ⇒ loops until stopped
        if (rep.remaining > 0 && queue.length) return void play(queue, 0, atEnd);
        return stop();
      }
      // Whole-surah/juzʾ loop: repeat from the top.
      if (loopRef.current && queue.length) return void play(queue, 0, atEnd);
      stop();
    };
    audio.onended = advanceOrEnd;
    // A missing translation-audio file skips gracefully to the next queue item
    // (per #204) instead of killing playback; an Arabic-reciter error still
    // stops outright, unchanged from before this feature.
    audio.onerror = source === "translation" ? advanceOrEnd : () => stop();
    void audio.play().then(
      () => {
        setCurrent(key);
        setIsPlaying(true);
        highlightAyah(key);
        // Fires for both sources (harmless repeat in interleaved mode) — in
        // translation-only mode there is no "arabic" item to advance on.
        onAyah?.(verse);
      },
      () => stop(),
    );
  }

  /**
   * Tap-a-word-to-hear (#145): seek the verse audio to one word's timing segment
   * and play just that word, then pause at its segment end. Reuses the same
   * quran.com word timings the reciting highlight uses; needs a reciter with
   * `quranComId` (word timings) — a no-op otherwise.
   */
  async function playWord(verseKey: string, wordIndex: number) {
    const reciter = reciters.find((r) => r.id === reciterId) ?? reciters[0];
    if (!reciter) return;
    const token = ++tokenRef.current; // cancels any running recitation
    repeatRef.current = null;
    const timing = await getTiming(reciter, verseKey);
    if (token !== tokenRef.current) return;
    const seg = timing.segments.find((s) => s[0] === wordIndex);
    if (!seg) return;

    const audio = (audioRef.current ??= new Audio());
    audio.onended = null;
    audio.ontimeupdate = null;
    audio.pause();
    clearWord();

    const startSec = seg[2] / 1000;
    const endSec = seg[3] / 1000;
    wordRef.current = {
      block: document.getElementById(verseKey),
      segments: timing.segments,
      last: -1,
    };
    const [wSura, wAya] = verseKey.split(":").map(Number) as [number, number];
    const localWord = await webAudioStore.localUrl(reciter.id, { sura: wSura, aya: wAya });
    if (token !== tokenRef.current) {
      if (localWord) URL.revokeObjectURL(localWord);
      return;
    }
    setAudioSrc(audio, localWord ?? timing.url);
    audio.playbackRate = rateRef.current;

    const begin = () => {
      if (token !== tokenRef.current) return;
      audio.currentTime = startSec;
      audio.ontimeupdate = () => {
        const a = audioRef.current;
        if (!a) return;
        if (a.currentTime >= endSec) {
          a.pause();
          a.ontimeupdate = null;
          clearWord();
          setIsPlaying(false);
        } else {
          onTimeUpdate();
        }
      };
      audio.onended = () => {
        clearWord();
        setIsPlaying(false);
      };
      void audio.play().then(
        () => setIsPlaying(true),
        () => {},
      );
    };
    // `load()` guarantees a fresh `loadedmetadata` (so the seek lands) even when
    // the same verse is tapped twice in a row.
    audio.load();
    audio.addEventListener("loadedmetadata", begin, { once: true });
  }

  function toggle() {
    const audio = audioRef.current;
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      // Drop the reciting highlight on pause so it can't linger on one āyah while
      // the reader's current marker sits on another (the resume marker takes over).
      highlightAyah(null);
    } else if (current && audio) {
      void audio.play();
      setIsPlaying(true);
      highlightAyah(current);
    } else {
      // A fresh ▶ begins at the reader's current āyah (where you are), not the
      // surah start; fall back to the first verse before anything is marked.
      const start = startVerse?.() ?? versesRef.current[0];
      if (start) playAll(start);
    }
  }

  // Flag the body while audio actively plays, so the reader can hide its current
  // marker and leave the reciting highlight as the sole indicator (see CSS).
  useEffect(() => {
    document.body.classList.toggle("audio-playing", isPlaying);
    return () => document.body.classList.remove("audio-playing");
  }, [isPlaying]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const node = event.target as HTMLElement;
      // Tap-a-word-to-hear (#145): in this mode a word tap plays just that word.
      if (document.body.classList.contains("tap-hear-on")) {
        const word = node.closest<HTMLElement>(".w");
        const block = word?.closest<HTMLElement>(".ayah");
        if (word && block?.id && word.dataset.w !== undefined) {
          event.preventDefault();
          void playWord(block.id, Number(word.dataset.w));
          return;
        }
      }
      const one = node.closest<HTMLElement>("[data-play-one]");
      if (one) {
        event.preventDefault();
        repeatRef.current = null;
        const queue = buildPlayQueue([parseKey(one.dataset.playOne!)], playModeRef.current);
        void play(queue, 0, "stop");
        return;
      }
      const from = node.closest<HTMLElement>("[data-play-key]");
      if (!from) return;
      event.preventDefault();
      playAll(parseKey(from.dataset.playKey!));
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      audioRef.current?.pause();
    };
    // translationVoiceId is read directly (not via a ref) inside play(), same
    // as reciterId — re-attach so the closure never plays a stale voice.
  }, [reciterId, translationVoiceId]);

  if (reciters.length === 0) return null;

  // Shared speed + A→B range controls (rendered in both variants).
  const list = versesRef.current;
  const multiSurah = new Set(list.map((v) => v.sura)).size > 1;
  const ayahLabel = (v: Verse): string => (multiSurah ? `${v.sura}:${v.aya}` : `${v.aya}`);
  const fromVal = rangeFrom ?? (list[0] ? keyOf(list[0]) : "");
  const toVal = rangeTo ?? (list.length ? keyOf(list[list.length - 1]!) : "");
  const ctrlStyle = {
    background: "none",
    border: `1px solid ${N.border}`,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: N.ui,
    fontSize: 12.5,
    fontWeight: 600,
    padding: "5px 8px",
    flexShrink: 0,
  } as const;
  const selStyle = {
    background: N.card,
    color: N.fg,
    border: `1px solid ${N.border}`,
    borderRadius: 8,
    padding: "5px 8px",
    fontFamily: N.ui,
    fontSize: 12.5,
  } as const;
  const speedButton = (
    <button
      type="button"
      onClick={cycleRate}
      title="Playback speed"
      aria-label={`Playback speed ${rateLabel(rate)}`}
      style={{ ...ctrlStyle, color: rate !== 1 ? N.gold : N.muted, minWidth: 40 }}
    >
      {rateLabel(rate)}
    </button>
  );
  const rangeButton = (
    <button
      type="button"
      onClick={() => setShowRange((v) => !v)}
      aria-pressed={showRange}
      title="Repeat a range of āyāt (A–B)"
      style={{ ...ctrlStyle, color: showRange ? N.gold : N.muted }}
    >
      A–B
    </button>
  );
  const playModeLabel: Record<TranslationPlayMode, string> = {
    "arabic-only": "Translation audio off",
    interleaved: "Arabic + translation audio",
    "translation-only": "Translation audio only",
  };
  const translationModeButton =
    translationVoices.length > 0 ? (
      <button
        type="button"
        onClick={cyclePlayMode}
        title={playModeLabel[playMode]}
        aria-label={playModeLabel[playMode]}
        style={{ ...ctrlStyle, color: playMode !== "arabic-only" ? N.gold : N.muted }}
      >
        <Icon name="globe" size={15} />
      </button>
    ) : null;
  const translationVoicePicker =
    playMode !== "arabic-only" && translationVoices.length > 0 ? (
      translationVoices.length > 1 ? (
        <select
          aria-label="Translation-audio voice"
          value={translationVoiceId}
          onChange={(e) => {
            setTranslationVoiceId(e.target.value);
            writeTranslationVoice(e.target.value);
            stop();
          }}
          style={{ ...selStyle, maxWidth: 180 }}
        >
          {translationVoices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      ) : (
        <span
          className="noor-hide-sm"
          style={{ fontSize: 12, color: N.muted, fontFamily: N.ui, whiteSpace: "nowrap" }}
        >
          {translationVoices[0]!.name}
        </span>
      )
    ) : null;
  const allSaved = listSurahs.length > 0 && listSurahs.every((s) => savedSurahs.has(s));
  const downloadPct = download ? Math.round((download.done / Math.max(1, download.total)) * 100) : 0;
  const downloadButton = (
    <button
      type="button"
      onClick={() => void downloadAudio()}
      disabled={download !== null || allSaved}
      aria-label={
        download
          ? `Downloading ${downloadPct}%`
          : allSaved
            ? "Saved for offline listening"
            : "Download for offline listening"
      }
      title={
        download
          ? `Downloading… ${downloadPct}%`
          : allSaved
            ? "Saved for offline listening"
            : "Download for offline listening"
      }
      style={{
        ...ctrlStyle,
        color: download || allSaved ? N.gold : N.muted,
        minWidth: download ? 44 : 34,
        display: "grid",
        placeItems: "center",
      }}
    >
      {download ? `${downloadPct}%` : <Icon name={allSaved ? "check" : "download"} size={16} />}
    </button>
  );
  const rangePanel = showRange ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "8px clamp(14px, 4vw, 40px)",
        borderTop: `1px solid ${N.border}`,
        background: N.bg2,
        fontFamily: N.ui,
        fontSize: 12.5,
        color: N.muted,
      }}
    >
      <span style={{ fontWeight: 600, color: N.fg }}>Repeat</span>
      <select
        aria-label="From āyah"
        value={fromVal}
        onChange={(e) => setRangeFrom(e.target.value)}
        style={selStyle}
      >
        {list.map((v) => (
          <option key={keyOf(v)} value={keyOf(v)}>
            {ayahLabel(v)}
          </option>
        ))}
      </select>
      <span aria-hidden>→</span>
      <select
        aria-label="To āyah"
        value={toVal}
        onChange={(e) => setRangeTo(e.target.value)}
        style={selStyle}
      >
        {list.map((v) => (
          <option key={keyOf(v)} value={keyOf(v)}>
            {ayahLabel(v)}
          </option>
        ))}
      </select>
      <select
        aria-label="Repeat count"
        value={String(repeatCount)}
        onChange={(e) => setRepeatCount(Number(e.target.value))}
        style={selStyle}
      >
        {REPEAT_COUNTS.map((c) => (
          <option key={c.label} value={String(c.value)}>
            {c.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => playRange(fromVal, toVal, repeatCount)}
        style={{
          background: N.goldGrad,
          color: N.ink,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontFamily: N.ui,
          fontWeight: 600,
          fontSize: 12.5,
          padding: "6px 12px",
        }}
      >
        ▶ Loop range
      </button>
    </div>
  ) : null;

  if (variant === "dock") {
    const pos = current ? list.findIndex((v) => keyOf(v) === current) : -1;
    const pct = pos >= 0 && list.length > 0 ? ((pos + 1) / list.length) * 100 : 0;
    const currentAya = current ? parseKey(current).aya : null;
    const reciterName =
      reciters.find((r) => r.id === reciterId)?.name ?? reciters[0]?.name ?? "Reciter";
    return (
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {rangePanel}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "10px clamp(14px, 4vw, 40px)",
            borderTop: `1px solid ${N.border}`,
            background: N.bg2,
          }}
        >
          <button
            type="button"
            onClick={toggle}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: N.goldGrad,
              color: N.ink,
              display: "grid",
              placeItems: "center",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={18} color={N.ink} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: N.muted,
                marginBottom: 6,
                fontFamily: N.ui,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: N.fg,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {reciterName}
                {currentAya ? ` · Āyah ${currentAya}` : ""}
              </span>
              <span className="noor-hide-sm" style={{ flexShrink: 0, marginLeft: 10 }}>
                {isPlaying ? "Now playing" : current ? "Paused" : "Tap ▶ on an āyah"}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: N.border }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 2,
                  background: N.gold,
                  transition: "width .3s",
                }}
              />
            </div>
          </div>
          {speedButton}
          {rangeButton}
          {downloadButton}
          {translationModeButton}
          {translationVoicePicker}
          <button
            type="button"
            onClick={toggleLoop}
            aria-pressed={loop}
            title="Repeat the surah continuously"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: loop ? N.gold : N.muted,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              padding: 4,
            }}
          >
            <Icon name="repeat" size={18} />
          </button>
          {reciters.length > 1 && (
            <select
              className="noor-hide-sm"
              aria-label="Reciter"
              value={reciterId}
              onChange={(e) => {
                setReciterId(e.target.value);
                void writeReciter(e.target.value);
                stop();
              }}
              style={{
                flexShrink: 0,
                background: N.card,
                color: N.muted,
                border: `1px solid ${N.border}`,
                borderRadius: 9,
                padding: "7px 10px",
                fontFamily: N.ui,
                fontSize: 13,
                maxWidth: 160,
              }}
            >
              {reciters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="audio-bar">
        <button type="button" className="audio-play" onClick={toggle} aria-pressed={isPlaying}>
          {isPlaying ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button
          type="button"
          className={loop ? "chip chip--on" : "chip"}
          onClick={toggleLoop}
          aria-pressed={loop}
          title="Repeat the surah continuously"
        >
          🔁 Loop
        </button>
        {speedButton}
        {rangeButton}
        {downloadButton}
        {translationModeButton}
        {translationVoicePicker}
        <span className="audio-status">
          {current ? `Playing ${current}` : "Tap ▶ to play one āyah, or its number to play on"}
        </span>
        {reciters.length > 1 && (
          <select
            className="audio-reciter"
            aria-label="Reciter"
            value={reciterId}
            onChange={(e) => {
              setReciterId(e.target.value);
              void writeReciter(e.target.value);
              stop();
            }}
          >
            {reciters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {rangePanel}
    </div>
  );
}
