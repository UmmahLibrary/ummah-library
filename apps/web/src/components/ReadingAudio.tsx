"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ReciterPlugin,
  cyclePlaybackRate,
  quranComAudioUrl,
  reciterAudioUrl,
  repeatRange,
} from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { readReciter, writeReciter } from "../lib/reader-prefs";
import { readLoop, readRate, writeLoop, writeRate } from "../lib/reader-prefs-store";

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

type Segment = [wordIndex: number, position: number, startMs: number, endMs: number];
interface Timing {
  url: string;
  segments: Segment[];
}

const timingCache = new Map<string, Promise<Timing | null>>();
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
 * Audio player for an ordered list of verses, which may span surahs (used by
 * both the surah reader and the juzʾ reader). Each ayah block must have
 * id="sura:aya"; play buttons use data-play-key (play from there) or
 * data-play-one (play just that ayah). Words highlight via quran.com timing.
 */
export function ReadingAudio({
  verses,
  reciters,
  variant = "inline",
}: {
  verses: Verse[];
  reciters: ReciterPlugin[];
  /** "inline" = compact bar inside content (juzʾ); "dock" = fixed bottom player (surah reader). */
  variant?: "inline" | "dock";
}) {
  const [reciterId, setReciterId] = useState(reciters[0]?.id ?? "");
  const [current, setCurrent] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [rate, setRate] = useState(1);
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
  // The verse list the current playback traverses — the whole list, or an A→B
  // slice while range-repeating. `repeatRef` holds the countdown while a range
  // loop is active (Infinity = until stopped); null otherwise.
  const activeListRef = useRef<Verse[]>(verses);
  const repeatRef = useRef<{ remaining: number } | null>(null);
  const versesRef = useRef(verses);
  versesRef.current = verses;
  const wordRef = useRef<{ block: HTMLElement | null; segments: Segment[] | null; last: number }>({
    block: null,
    segments: null,
    last: -1,
  });

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

  /** Play the whole list from `start`, advancing ayah-to-ayah (no range loop). */
  function playAll(start: Verse) {
    repeatRef.current = null;
    activeListRef.current = versesRef.current;
    void play(start, true);
  }

  /** Loop the inclusive A→B range `count` times (Infinity = until stopped). */
  function playRange(from: string | null, to: string | null, count: number) {
    const slice = repeatRange(versesRef.current, from, to);
    const start = slice[0];
    if (!start) return;
    repeatRef.current = { remaining: count };
    activeListRef.current = slice;
    void play(start, true);
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

  async function play(verse: Verse, advance: boolean) {
    const reciter = reciters.find((r) => r.id === reciterId) ?? reciters[0];
    if (!reciter) {
      stop();
      return;
    }
    const key = keyOf(verse);
    const token = ++tokenRef.current;
    const audio = (audioRef.current ??= new Audio());
    // Detach the previous āyah's handlers and pause it BEFORE any await: playAll/
    // playRange mutate the shared refs (activeListRef/repeatRef) synchronously, so a
    // stale onended firing during the fetchTiming await would advance the wrong āyah
    // or decrement the new range's count. Neutralize it here, before we yield.
    audio.onended = null;
    audio.ontimeupdate = null;
    audio.pause();
    clearWord();

    let src: string | undefined;
    let segments: Segment[] | null = null;
    if (reciter.quranComId) {
      const timing = await fetchTiming(reciter.quranComId, key);
      if (token !== tokenRef.current) return;
      if (timing) {
        src = timing.url;
        segments = timing.segments;
      }
    }
    src ??= reciterAudioUrl(reciter, { sura: verse.sura, aya: verse.aya });

    wordRef.current = { block: document.getElementById(key), segments, last: -1 };
    audio.src = src;
    audio.playbackRate = rateRef.current;
    audio.ontimeupdate = segments ? onTimeUpdate : null;
    audio.onended = () => {
      if (!advance) return stop();
      const list = activeListRef.current;
      const idx = list.findIndex((v) => v.sura === verse.sura && v.aya === verse.aya);
      const next = idx >= 0 ? list[idx + 1] : undefined;
      if (next) return void play(next, true);
      // Reached the end of the active list.
      const rep = repeatRef.current;
      if (rep) {
        rep.remaining -= 1; // Infinity - 1 stays Infinity ⇒ loops until stopped
        if (rep.remaining > 0 && list[0]) return void play(list[0], true);
        return stop();
      }
      // Whole-surah/juzʾ loop: repeat from the top.
      if (loopRef.current && list[0]) return void play(list[0], true);
      stop();
    };
    audio.onerror = () => stop();
    void audio.play().then(
      () => {
        setCurrent(key);
        setIsPlaying(true);
        highlightAyah(key);
      },
      () => stop(),
    );
  }

  function toggle() {
    const audio = audioRef.current;
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else if (current && audio) {
      void audio.play();
      setIsPlaying(true);
    } else if (versesRef.current[0]) {
      playAll(versesRef.current[0]);
    }
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const node = event.target as HTMLElement;
      const one = node.closest<HTMLElement>("[data-play-one]");
      if (one) {
        event.preventDefault();
        void play(parseKey(one.dataset.playOne!), false);
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
  }, [reciterId]);

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
        <span className="audio-status">
          {current ? `Playing ${current}` : "Tap ▶ to play one āyah, or its number to play on"}
        </span>
        {reciters.length > 1 && (
          <select
            className="audio-reciter"
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
