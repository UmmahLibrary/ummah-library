"use client";

import { useEffect, useRef, useState } from "react";
import { type ReciterPlugin, quranComAudioUrl, reciterAudioUrl } from "@ummahlibrary/core";
import { N, Icon } from "./noor";

const RECITER_KEY = "ul.reciter";
const LOOP_KEY = "ul.loop";

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
        return audio
          ? { url: quranComAudioUrl(audio.url), segments: audio.segments }
          : null;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef(0);
  // Read live inside the playback `onended` closure, not a stale capture.
  const loopRef = useRef(false);
  const versesRef = useRef(verses);
  versesRef.current = verses;
  const wordRef = useRef<{ block: HTMLElement | null; segments: Segment[] | null; last: number }>({
    block: null,
    segments: null,
    last: -1,
  });

  useEffect(() => {
    const saved = localStorage.getItem(RECITER_KEY);
    if (saved && reciters.some((r) => r.id === saved)) setReciterId(saved);
    const savedLoop = localStorage.getItem(LOOP_KEY) === "1";
    setLoop(savedLoop);
    loopRef.current = savedLoop;
  }, [reciters]);

  function toggleLoop() {
    const next = !loopRef.current;
    loopRef.current = next;
    setLoop(next);
    localStorage.setItem(LOOP_KEY, next ? "1" : "0");
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
    audio.ontimeupdate = segments ? onTimeUpdate : null;
    audio.onended = () => {
      if (!advance) return stop();
      const list = versesRef.current;
      const idx = list.findIndex((v) => v.sura === verse.sura && v.aya === verse.aya);
      const next = idx >= 0 ? list[idx + 1] : undefined;
      if (next) void play(next, true);
      // End of the surah/juzʾ: repeat from the top when looping.
      else if (loopRef.current && list[0]) void play(list[0], true);
      else stop();
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
      void play(versesRef.current[0], true);
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
      void play(parseKey(from.dataset.playKey!), true);
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      audioRef.current?.pause();
    };
  }, [reciterId]);

  if (reciters.length === 0) return null;

  if (variant === "dock") {
    const list = versesRef.current;
    const pos = current ? list.findIndex((v) => keyOf(v) === current) : -1;
    const pct = pos >= 0 && list.length > 0 ? ((pos + 1) / list.length) * 100 : 0;
    const currentAya = current ? parseKey(current).aya : null;
    const reciterName = reciters.find((r) => r.id === reciterId)?.name ?? reciters[0]?.name ?? "Reciter";
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px clamp(14px, 4vw, 40px)",
          borderTop: `1px solid ${N.border}`,
          background: N.bg2,
          flexShrink: 0,
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
              style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: N.gold, transition: "width .3s" }}
            />
          </div>
        </div>
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
              localStorage.setItem(RECITER_KEY, e.target.value);
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
    );
  }

  return (
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
      <span className="audio-status">
        {current ? `Playing ${current}` : "Tap ▶ to play one āyah, or its number to play on"}
      </span>
      {reciters.length > 1 && (
        <select
          className="audio-reciter"
          value={reciterId}
          onChange={(e) => {
            setReciterId(e.target.value);
            localStorage.setItem(RECITER_KEY, e.target.value);
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
  );
}
