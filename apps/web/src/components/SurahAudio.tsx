"use client";

import { useEffect, useRef, useState } from "react";
import { type ReciterPlugin, reciterAudioUrl } from "@ummahlibrary/core";

const RECITER_KEY = "ul.reciter";

type Segment = [wordIndex: number, position: number, startMs: number, endMs: number];
interface Timing {
  url: string;
  segments: Segment[];
}

// One fetch per (reciter, verse) for the quran.com audio + word segments.
const timingCache = new Map<string, Promise<Timing | null>>();
function fetchTiming(recitationId: number, verseKey: string): Promise<Timing | null> {
  const key = `${recitationId}:${verseKey}`;
  let pending = timingCache.get(key);
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
          ? { url: `https://verses.quran.com/${audio.url}`, segments: audio.segments }
          : null;
      } catch {
        return null;
      }
    })();
    timingCache.set(key, pending);
  }
  return pending;
}

export function SurahAudio({
  surah,
  ayahCount,
  reciters,
}: {
  surah: number;
  ayahCount: number;
  reciters: ReciterPlugin[];
}) {
  const [reciterId, setReciterId] = useState(reciters[0]?.id ?? "");
  const [current, setCurrent] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef(0);
  // The currently-playing ayah's word segments + last-highlighted word.
  const wordRef = useRef<{ block: HTMLElement | null; segments: Segment[] | null; last: number }>({
    block: null,
    segments: null,
    last: -1,
  });

  useEffect(() => {
    const saved = localStorage.getItem(RECITER_KEY);
    if (saved && reciters.some((r) => r.id === saved)) setReciterId(saved);
  }, [reciters]);

  function clearWordHighlight() {
    document.querySelectorAll(".w--active").forEach((el) => el.classList.remove("w--active"));
    wordRef.current = { block: null, segments: null, last: -1 };
  }

  function highlightAyah(aya: number | null) {
    document
      .querySelectorAll(".ayah--playing")
      .forEach((el) => el.classList.remove("ayah--playing"));
    if (aya === null) return;
    const el = document.getElementById(`${surah}:${aya}`);
    el?.classList.add("ayah--playing");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Highlights the word matching the audio's current time (stable handler).
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
    clearWordHighlight();
  }

  async function play(aya: number, advance: boolean) {
    const reciter = reciters.find((r) => r.id === reciterId) ?? reciters[0];
    if (!reciter || aya < 1 || aya > ayahCount) {
      stop();
      return;
    }
    const token = ++tokenRef.current;
    const audio = (audioRef.current ??= new Audio());
    clearWordHighlight();

    let src: string | undefined;
    let segments: Segment[] | null = null;
    if (reciter.quranComId) {
      const timing = await fetchTiming(reciter.quranComId, `${surah}:${aya}`);
      if (token !== tokenRef.current) return; // superseded by another click
      if (timing) {
        src = timing.url;
        segments = timing.segments;
      }
    }
    src ??= reciterAudioUrl(reciter, { sura: surah, aya });

    wordRef.current = { block: document.getElementById(`${surah}:${aya}`), segments, last: -1 };
    audio.src = src;
    audio.ontimeupdate = segments ? onTimeUpdate : null;
    audio.onended = advance ? () => void play(aya + 1, advance) : () => stop();
    audio.onerror = () => stop();
    void audio.play().then(
      () => {
        setCurrent(aya);
        setIsPlaying(true);
        highlightAyah(aya);
      },
      () => stop(),
    );
  }

  function toggle() {
    const audio = audioRef.current;
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else if (current !== null && audio) {
      void audio.play();
      setIsPlaying(true);
    } else {
      void play(1, true);
    }
  }

  // Delegate clicks: `data-play-single` plays one ayah; `data-play-aya` from there.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const node = event.target as HTMLElement;
      const single = node.closest<HTMLElement>("[data-play-single]");
      if (single) {
        event.preventDefault();
        void play(Number(single.dataset.playSingle), false);
        return;
      }
      const from = node.closest<HTMLElement>("[data-play-aya]");
      if (!from) return;
      event.preventDefault();
      void play(Number(from.dataset.playAya), true);
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      audioRef.current?.pause();
    };
  }, [reciterId, surah, ayahCount]);

  if (reciters.length === 0) return null;

  return (
    <div className="audio-bar">
      <button type="button" className="audio-play" onClick={toggle} aria-pressed={isPlaying}>
        {isPlaying ? "❚❚ Pause" : "▶ Play surah"}
      </button>
      <span className="audio-status">
        {current !== null
          ? `Playing āyah ${current}`
          : "Tap ▶ to play one āyah, or its number to play on"}
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
